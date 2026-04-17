const { Op } = require('sequelize');
const { models } = require('../db');
const emailService = require('./emailService');
const { shouldCreateNotification } = require('../utils/notificationPreferences');
const { NOTIFICATION_EVENTS, NOTIFICATION_MATRIX } = require('../config/notificationMatrix');

class NotificationOrchestrator {
  isNotificationEmailEnabled() {
    const raw = String(process.env.EMAIL_NOTIFICATION_EMAILS_ENABLED || 'false').trim().toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes';
  }

  getDisabledEmailEvents() {
    const raw = process.env.EMAIL_DISABLED_EVENTS || '';
    return new Set(
      raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  async dispatch({ eventKey, recipients, payload, dedupe = null, channelOverrides = null }) {
    const matrix = NOTIFICATION_MATRIX[eventKey];
    if (!matrix || !Array.isArray(recipients) || recipients.length === 0) {
      return { delivered: 0, skipped: recipients?.length || 0 };
    }

    const channels = channelOverrides
      ? { ...matrix.channels, ...channelOverrides }
      : matrix.channels;

    const recipientIds = [...new Set(recipients.map((r) => r.userId).filter(Boolean))];
    if (recipientIds.length === 0) {
      return { delivered: 0, skipped: 0 };
    }

    const users = await models.User.findAll({
      where: { id: recipientIds },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'status'],
      include: [{
        model: models.UserSettings,
        as: 'settings',
        required: false,
        attributes: ['emailNotifications', 'quietHours']
      }]
    });

    const userById = new Map(users.map((u) => [u.id, u]));
    let delivered = 0;
    let skipped = 0;

    for (const recipient of recipients) {
      const user = userById.get(recipient.userId);
      if (!user || user.status !== 'active') {
        skipped += 1;
        continue;
      }

      const shouldSkipByDedupe = await this.shouldSkipByDedupe(recipient.userId, matrix.type, dedupe, payload);

      const settings = user.settings || null;
      const preferenceKey = matrix.preferenceKey;

      // In-app channel
      if (channels.inApp) {
        if (!shouldSkipByDedupe) {
          await models.Notification.create({
            userId: recipient.userId,
            type: matrix.type,
            title: payload.title,
            message: payload.message,
            actionUrl: payload.actionUrl || null,
            actionLabel: payload.actionLabel || null,
            relatedEntityType: payload.relatedEntityType || null,
            relatedEntityId: payload.relatedEntityId || null,
            status: 'unread'
          });
          delivered += 1;
        }
      }

      // Email channel
      if (channels.email) {
        const notificationEmailEnabled = this.isNotificationEmailEnabled();
        const isEventEmailDisabled = this.getDisabledEmailEvents().has(eventKey);
        const allowedByPrefs = shouldCreateNotification(settings, preferenceKey, {
          checkEmail: true,
          checkPush: false,
          respectQuietHours: false
        }).should_create;

        if (notificationEmailEnabled && !isEventEmailDisabled && !shouldSkipByDedupe && allowedByPrefs && user.email) {
          await emailService.sendEmail({
            to: user.email,
            subject: payload.emailSubject || payload.title,
            text: payload.emailText || payload.message,
            html: payload.emailHtml || null,
            emailType: eventKey,
            recipientId: recipient.userId,
            metadata: {
              relatedEntityType: payload.relatedEntityType || null,
              relatedEntityId: payload.relatedEntityId || null
            }
          });
        }
      }

    }

    return { delivered, skipped };
  }

  async shouldSkipByDedupe(userId, type, dedupe, payload = null) {
    const dedupeType = dedupe?.relatedEntityType || null;
    const dedupeId = dedupe?.relatedEntityId || null;
    const payloadType = payload?.relatedEntityType || null;
    const payloadId = payload?.relatedEntityId || null;

    const candidates = [
      dedupeType && dedupeId ? { relatedEntityType: dedupeType, relatedEntityId: dedupeId } : null,
      payloadType && payloadId ? { relatedEntityType: payloadType, relatedEntityId: payloadId } : null
    ].filter(Boolean);

    if (candidates.length === 0) {
      return false;
    }

    const existing = await models.Notification.findOne({
      where: {
        userId,
        type,
        [Op.or]: candidates
      },
      attributes: ['id']
    });

    return Boolean(existing);
  }

  async sendWelcomeEmail(user) {
    return this.dispatch({
      eventKey: NOTIFICATION_EVENTS.ACCOUNT_CREATED_WELCOME,
      recipients: [{ userId: user.id }],
      payload: {
        title: 'Welcome to Pathment',
        message: `Welcome ${user.firstName || 'there'}! Your account is now ready.`,
        emailSubject: 'Welcome to Pathment',
        emailText: `Hi ${user.firstName || ''}, welcome to Pathment. Start your learning journey today.`
      }
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    // Transactional security email: always send regardless of notification preferences.
    return emailService.sendEmail({
      to: user.email,
      subject: 'Reset your Pathment password',
      text: `Hi ${user.firstName || ''}, use this secure link to reset your password: ${resetUrl}`,
      html: `
        <p>Hi ${user.firstName || 'there'},</p>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `
    });
  }

  async sendEmailVerificationEmail(user, verificationToken) {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;

    // Transactional auth email: always send regardless of notification preferences.
    return emailService.sendEmail({
      to: user.email,
      subject: 'Verify your Pathment email',
      text: `Hi ${user.firstName || ''}, verify your email by opening this link: ${verifyUrl}`,
      html: `
        <p>Hi ${user.firstName || 'there'},</p>
        <p>Welcome to Pathment. Please verify your email address to continue.</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
      `
    });
  }

  async sendRegistrationInviteEmail({ email, role, inviteUrl }) {
    return emailService.sendEmail({
      to: email,
      subject: `You're invited to join Pathment as a ${role}`,
      text: `You were invited to join Pathment as a ${role}. Use this one-time invite link: ${inviteUrl}`,
      html: `
        <p>Hello,</p>
        <p>You were invited to join Pathment as a <strong>${role}</strong>.</p>
        <p><a href="${inviteUrl}">Accept Invite</a></p>
        <p>This invite link is one-time use and may expire.</p>
      `
    });
  }
}

module.exports = new NotificationOrchestrator();
module.exports.NOTIFICATION_EVENTS = NOTIFICATION_EVENTS;

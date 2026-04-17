const { Resend } = require('resend');
const { Op } = require('sequelize');
const { models } = require('../db');

class EmailService {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.from = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'Pathment <noreply@pathment.me>';
    this.replyTo = process.env.RESEND_REPLY_TO || process.env.EMAIL_REPLY_TO || null;
    this.init();
  }

  init() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.enabled = false;
      return;
    }

    this.client = new Resend(apiKey);
    this.enabled = true;
  }

  parsePositiveInt(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  getUtcStartOfDay(date = new Date()) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  async isWithinDailyLimits(recipientEmail) {
    const globalLimit = this.parsePositiveInt(process.env.EMAIL_DAILY_LIMIT, 100);
    const perRecipientLimit = this.parsePositiveInt(process.env.EMAIL_DAILY_LIMIT_PER_RECIPIENT, 20);
    const startOfDay = this.getUtcStartOfDay();

    const sentToday = await models.EmailQueue.count({
      where: {
        status: 'sent',
        sentAt: { [Op.gte]: startOfDay }
      }
    });

    if (sentToday >= globalLimit) {
      return { allowed: false, reason: 'global_daily_limit_reached' };
    }

    const sentToRecipientToday = await models.EmailQueue.count({
      where: {
        status: 'sent',
        recipientEmail,
        sentAt: { [Op.gte]: startOfDay }
      }
    });

    if (sentToRecipientToday >= perRecipientLimit) {
      return { allowed: false, reason: 'recipient_daily_limit_reached' };
    }

    return { allowed: true };
  }

  async sendEmail({ to, subject, text, html, emailType = 'system', recipientId = null, metadata = null }) {
    if (!to || !subject) {
      return { sent: false, reason: 'invalid_payload' };
    }

    if (!this.enabled) {
      // Keep dev/test environments functional without Resend credentials.
      console.log('[email:disabled]', { to, subject, preview: text?.slice(0, 120) || '' });
      return { sent: false, reason: 'resend_not_configured' };
    }

    const toList = (Array.isArray(to) ? to : [to]).map((item) => String(item).trim()).filter(Boolean);
    const primaryRecipient = String(toList[0] || '').trim().toLowerCase();

    if (!primaryRecipient) {
      return { sent: false, reason: 'invalid_payload' };
    }

    const limitCheck = await this.isWithinDailyLimits(primaryRecipient);
    if (!limitCheck.allowed) {
      console.warn('[email:rate-limited]', { to: primaryRecipient, subject, reason: limitCheck.reason });
      return { sent: false, reason: limitCheck.reason };
    }

    const queueRow = await models.EmailQueue.create({
      recipientId,
      recipientEmail: primaryRecipient,
      subject,
      bodyHtml: html || null,
      bodyText: text || null,
      emailType,
      status: 'pending',
      metadata: {
        ...(metadata || {}),
        recipients: toList
      }
    });

    const payload = {
      from: this.from,
      to: toList,
      subject,
      text,
      html
    };

    if (this.replyTo) {
      payload.replyTo = this.replyTo;
    }

    try {
      const result = await this.client.emails.send(payload);
      await queueRow.update({
        status: 'sent',
        sentAt: new Date(),
        attemptCount: (queueRow.attemptCount || 0) + 1,
        metadata: {
          ...(queueRow.metadata || {}),
          resendId: result?.data?.id || null,
          sentTo: toList
        }
      });

      return { sent: true, id: result?.data?.id || null };
    } catch (error) {
      await queueRow.update({
        status: 'failed',
        failedAt: new Date(),
        attemptCount: (queueRow.attemptCount || 0) + 1,
        lastError: error?.message || 'email_send_failed'
      });
      throw error;
    }
  }
}

module.exports = new EmailService();

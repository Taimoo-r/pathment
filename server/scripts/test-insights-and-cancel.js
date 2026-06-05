/* Verifies (16) clanHealthService.orgInsights fairness/extensions math and
 * (11) meeting cancellation reason + mentee notification.
 * Run: node scripts/test-insights-and-cancel.js  (self-cleans) */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');
const clanService = require('../src/services/clanService');
const clanHealthService = require('../src/services/clanHealthService');
const schedulingService = require('../src/services/schedulingService');

const TAG = `ins_${Date.now()}_`;
const e = (s) => (TAG + s + '@x.io').toLowerCase();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const created = { users: [], programs: [], clans: [], meetings: [] };

async function mkUser(first, caps) {
  const u = await models.User.create({ email: e(first), passwordHash: 'x', role: caps[0], capabilities: caps, firstName: first, lastName: 'T', emailVerified: true, status: 'active' });
  created.users.push(u.id); return u;
}

(async () => {
  try {
    const admin = await mkUser('admin', ['admin']);
    const mentor = await mkUser('Dana', ['mentor']);
    const mentee = await mkUser('mentee', ['mentee']);
    const program = await models.Program.create({ createdBy: admin.id, name: TAG + 'prog', description: 'd', type: 'mentorship', totalDurationWeeks: 12, status: 'published', visibility: 'private' });
    created.programs.push(program.id);
    const clan = await clanService.createClan({ programId: program.id, name: TAG + 'clan', leadMentorId: mentor.id }, admin.id);
    created.clans.push(clan.id);
    await clanService.addMember(clan.id, { userId: mentee.id, role: 'mentee' });

    // Give the mentee 40% absolute progress + an accepted external delay (10 days → +15 fair).
    const enrollment = await models.Enrollment.findOne({ where: { menteeId: mentee.id, programId: program.id } });
    await enrollment.update({ overallProgressPercentage: 40 });
    await models.DelayEvent.create({ menteeId: mentee.id, reason: 'power cuts', kind: 'electricity', days: 10, accepted: true, category: 'external' });
    await models.Blocker.create({ menteeId: mentee.id, title: TAG + 'blk', status: 'open', severity: 'medium' });

    // ── 16: orgInsights ──────────────────────────────────────────────────────
    const insights = await clanHealthService.orgInsights();
    const row = insights.clans.find((c) => c.id === clan.id);
    ok(Boolean(row), 'clan appears in insights comparison');
    ok(row.avgCompletion === 40, `clan avgCompletion = 40 (got ${row?.avgCompletion})`);
    ok(row.avgRelative === 55, `clan avgRelative = 55 (40 + 15 fairness credit) (got ${row?.avgRelative})`);
    ok(row.extensions === 1, `clan extensions = 1 accepted delay (got ${row?.extensions})`);
    ok(row.openBlockers >= 1, `clan openBlockers counted (got ${row?.openBlockers})`);
    // Org gap spans ALL clans in the DB (by design), so just assert relative ≥ absolute and credit shows.
    ok(insights.fairness.avgRelative >= insights.fairness.avgAbsolute && insights.fairness.gap > 0, `org relative ≥ absolute, gap > 0 (got gap ${insights.fairness.gap})`);
    ok(insights.kpis.totalExtensions === 1, 'org total extensions = 1');
    const dist = insights.distribution.find((d) => d.id === mentee.id);
    ok(dist && dist.gap === 15, `distribution row gap = 15 (got ${dist?.gap})`);

    // ── 11: cancel with reason notifies the mentee ───────────────────────────
    // Book a meeting (mentor publishes a slot, mentee books).
    const slot = await models.AvailabilitySlot.create({ mentorId: mentor.id, day: 'Mon, Jun 9', time: '2:00 PM', durationMins: 30, taken: true, takenBy: mentee.id }).catch(() => null);
    const meeting = await models.ScheduledMeeting.create({
      mentorId: mentor.id, menteeId: mentee.id, availabilitySlotId: slot?.id || null,
      kind: '1:1', day: 'Mon, Jun 9', time: '2:00 PM', durationMins: 30, status: 'scheduled'
    });
    created.meetings.push(meeting.id);

    const REASON = 'Conference travel — let us rebook Thursday';
    await schedulingService.updateMeetingStatus(mentor.id, meeting.id, 'cancelled', REASON);
    await new Promise((r) => setTimeout(r, 300)); // fire-and-forget notify

    const fresh = await models.ScheduledMeeting.findByPk(meeting.id);
    ok(fresh.status === 'cancelled', 'meeting is cancelled');
    ok(fresh.cancellationReason === REASON, 'cancellation reason stored');
    ok(fresh.cancelledBy === mentor.id, 'cancelledBy = mentor');

    const notif = await models.Notification.findOne({ where: { userId: mentee.id, type: 'system', relatedEntityId: meeting.id } });
    ok(Boolean(notif), 'mentee got a cancellation notification');
    ok(notif && notif.message.includes(REASON), 'notification carries the reason');
    ok(notif && /Dana/.test(notif.message), 'notification names who cancelled');

    // Slot freed for rebooking.
    if (slot) { const s = await models.AvailabilitySlot.findByPk(slot.id); ok(s && !s.taken, 'slot freed after cancel'); }

    console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  } catch (err) {
    console.error('FATAL', err.message, err.stack);
    fail++;
  } finally {
    try {
      await models.Notification.destroy({ where: { userId: created.users } }).catch(() => {});
      await models.ScheduledMeeting.destroy({ where: { id: created.meetings } }).catch(() => {});
      await models.AvailabilitySlot.destroy({ where: { mentorId: created.users } }).catch(() => {});
      await models.DelayEvent.destroy({ where: { menteeId: created.users } }).catch(() => {});
      await models.Blocker.destroy({ where: { menteeId: created.users } }).catch(() => {});
      await models.ClanMembership.destroy({ where: { clanId: created.clans } }).catch(() => {});
      await models.Enrollment.destroy({ where: { menteeId: created.users } }).catch(() => {});
      await models.Clan.destroy({ where: { id: created.clans } }).catch(() => {});
      await models.Program.destroy({ where: { id: created.programs } }).catch(() => {});
      await models.User.destroy({ where: { id: created.users } }).catch(() => {});
      console.log('cleanup done');
    } catch (e2) { console.error('cleanup error', e2.message); }
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();

/* A mentee invited into / joining a clan must notify the clan's mentors (lead + co).
 * Tests both helpers directly (invite-time heads-up + registration "joined"). Self-cleaning.
 * Run: node scripts/test-new-mentee-notify.js */
const path = require('path');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');
const adminService = require('../src/services/adminService');
const authService = require('../src/services/authService');

const TAG = `nmn_${Date.now()}_`;
const e = (s) => (TAG + s + '@x.io').toLowerCase();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const created = { users: [], programs: [], clans: [], memberships: [] };

const mkUser = async (first, role) => {
  const u = await models.User.create({ email: e(first), passwordHash: 'x', role, capabilities: [role], firstName: first, lastName: 'T', emailVerified: true, status: 'active' });
  created.users.push(u.id);
  return u;
};

(async () => {
  try {
    const admin = await mkUser('admin', 'admin');
    const lead = await mkUser('lead', 'mentor');
    const co = await mkUser('co', 'mentor');
    const mentee = await mkUser('mentee', 'mentee');

    const prog = await models.Program.create({ createdBy: admin.id, name: `${TAG}P`, description: 'd', type: 'mentorship', status: 'published', visibility: 'private', totalDurationWeeks: 8, estimatedHoursPerWeek: 4 });
    created.programs.push(prog.id);
    const clan = await models.Clan.create({ programId: prog.id, name: `${TAG}Clan`, createdBy: admin.id, leadMentorId: lead.id });
    created.clans.push(clan.id);
    for (const [u, r] of [[lead, 'lead_mentor'], [co, 'co_mentor']]) {
      const m = await models.ClanMembership.create({ clanId: clan.id, userId: u.id, role: r, status: 'active' });
      created.memberships.push(m.id);
    }

    // 1) Invite-time heads-up → both mentors get an in-app notification.
    await adminService._notifyClanMentorsOfInvitedMentee({ clanId: clan.id, clanName: clan.name, email: mentee.email, inviteId: randomUUID() });
    const leadInvited = await models.Notification.findOne({ where: { userId: lead.id, relatedEntityType: 'mentee_invited' } });
    const coInvited = await models.Notification.findOne({ where: { userId: co.id, relatedEntityType: 'mentee_invited' } });
    ok(Boolean(leadInvited), 'lead mentor notified when mentee is invited');
    ok(Boolean(coInvited), 'co-mentor notified when mentee is invited');

    // 2) Registration placement → both mentors get the "joined" notification.
    await authService._notifyClanMentorsOfNewMentee({ clan: { id: clan.id, name: clan.name }, mentee });
    const leadJoined = await models.Notification.findOne({ where: { userId: lead.id, relatedEntityType: 'new_mentee' } });
    ok(Boolean(leadJoined), 'lead mentor notified when mentee joins');
    ok(/joined your clan/i.test(leadJoined?.message || ''), 'message names the join + clan');

    // 3) The mentee themselves is never notified about their own join.
    const menteeNote = await models.Notification.findOne({ where: { userId: mentee.id, relatedEntityType: 'new_mentee' } });
    ok(!menteeNote, 'the joining mentee is not self-notified');

    console.log(`\n${pass} passed, ${fail} failed`);
  } catch (err) {
    console.error('FATAL', err);
    fail++;
  } finally {
    for (const id of created.users) await models.Notification.destroy({ where: { userId: id } });
    for (const id of created.memberships) await models.ClanMembership.destroy({ where: { id } });
    for (const id of created.clans) await models.Clan.destroy({ where: { id } });
    for (const id of created.programs) await models.Program.destroy({ where: { id } });
    for (const id of created.users) await models.User.destroy({ where: { id } });
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();

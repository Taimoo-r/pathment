/* Verifies completion approval is clan-aware (a clan mentor with no
 * MentorMenteeMatch can approve). Run: node scripts/test-completion-clan.js */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');
const clanService = require('../src/services/clanService');
const enrollments = require('../src/services/enrollmentService');

const TAG = `complclan_${Date.now()}_`;
const e = (s) => (TAG + s + '@x.io').toLowerCase();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const created = { users: [], programs: [], clans: [] };

async function mkUser(first, caps) {
  const u = await models.User.create({ email: e(first), passwordHash: 'x', role: caps[0], capabilities: caps, firstName: first, lastName: 'T', emailVerified: true, status: 'active' });
  created.users.push(u.id); return u;
}

(async () => {
  try {
    const admin = await mkUser('admin', ['admin']);
    const mentor = await mkUser('mentor', ['mentor']);
    const outsiderMentor = await mkUser('outsider', ['mentor']);
    const mentee = await mkUser('mentee', ['mentee']);

    const program = await models.Program.create({ createdBy: admin.id, name: TAG + 'prog', description: 'd', type: 'mentorship', totalDurationWeeks: 12, status: 'published', visibility: 'private' });
    created.programs.push(program.id);
    const clan = await clanService.createClan({ programId: program.id, name: TAG + 'clan', leadMentorId: mentor.id }, admin.id);
    created.clans.push(clan.id);
    await clanService.addMember(clan.id, { userId: mentee.id, role: 'mentee' }); // creates active enrollment

    const enr = await models.Enrollment.findOne({ where: { menteeId: mentee.id, programId: program.id } });
    ok(Boolean(enr) && enr.status === 'active', 'clan mentee has an active enrollment (no MentorMenteeMatch)');
    const matchCount = await models.MentorMenteeMatch.count({ where: { enrollmentId: enr.id } });
    ok(matchCount === 0, 'there is genuinely no 1:1 match row');

    // mentee requests completion
    await enrollments.requestCompletion(enr.id, mentee.id, 'mentee');
    const afterReq = await models.Enrollment.findByPk(enr.id);
    ok(afterReq.status === 'pending_completion', 'mentee can request completion');

    // a mentor NOT in the clan cannot approve
    let denied = false;
    try { await enrollments.approveCompletion(enr.id, outsiderMentor.id, 'mentor'); }
    catch (err) { denied = /not the mentor/i.test(err.message); }
    ok(denied, 'a mentor outside the clan is rejected');

    // the clan lead mentor CAN approve (clan-aware authorization)
    const res = await enrollments.approveCompletion(enr.id, mentor.id, 'mentor');
    ok(res?.programCompleted === true, 'the clan mentor can approve completion (clan-aware)');
    const done = await models.Enrollment.findByPk(enr.id);
    ok(done.status === 'program_completed', 'enrollment is marked program_completed');

    console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  } catch (err) {
    console.error('FATAL', err.message, err.stack);
    fail++;
  } finally {
    try {
      await models.Enrollment.destroy({ where: { menteeId: created.users } }).catch(() => {});
      await models.ClanMembership.destroy({ where: { clanId: created.clans } }).catch(() => {});
      await models.Clan.destroy({ where: { id: created.clans } }).catch(() => {});
      await models.Program.destroy({ where: { id: created.programs } }).catch(() => {});
      await models.User.destroy({ where: { id: created.users } }).catch(() => {});
      console.log('cleanup done');
    } catch (e2) { console.error('cleanup error', e2.message); }
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();

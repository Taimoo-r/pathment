/* Synthetic E2E for the clan → enrollment → mentor-visibility → task-assignment
 * flow. Run: node scripts/test-clan-task-flow.js */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');
const clanService = require('../src/services/clanService');
const taskService = require('../src/services/taskService');
const schedulingService = require('../src/services/schedulingService');

const TAG = `clantask_${Date.now()}_`;
const e = (s) => (TAG + s + '@x.io').toLowerCase();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const created = { users: [], programs: [], clans: [], cohorts: [], memberships: [], enrollments: [], assigned: [], roadmapTasks: [] };

async function mkUser(first, caps) {
  const u = await models.User.create({
    email: e(first), passwordHash: 'x', role: caps[0], capabilities: caps,
    firstName: first, lastName: 'T', emailVerified: true, status: 'active'
  });
  created.users.push(u.id);
  return u;
}

(async () => {
  try {
    const admin = await mkUser('admin', ['admin']);
    const mentor = await mkUser('mentor', ['mentor']);
    const mentee = await mkUser('mentee', ['mentee']);
    const outsider = await mkUser('outsider', ['mentee']);

    const program = await models.Program.create({
      createdBy: admin.id, name: TAG + 'prog', description: 'd', type: 'mentorship', totalDurationWeeks: 12, status: 'published', visibility: 'private'
    });
    created.programs.push(program.id);

    // createClan with a lead mentor → lead_mentor membership
    const clan = await clanService.createClan({ programId: program.id, name: TAG + 'clan', leadMentorId: mentor.id }, admin.id);
    created.clans.push(clan.id);

    // ── add a mentee to the clan ────────────────────────────────────────────
    const membership = await clanService.addMember(clan.id, { userId: mentee.id, role: 'mentee' });
    created.memberships.push(membership.id);

    // FIX 1: placement creates an active enrollment + links it to the membership
    const enr = await models.Enrollment.findOne({ where: { menteeId: mentee.id, programId: program.id } });
    ok(Boolean(enr) && enr.status === 'active', 'adding a mentee to a clan creates an active enrollment');
    created.enrollments.push(enr?.id);
    const reloadedMembership = await models.ClanMembership.findByPk(membership.id);
    ok(reloadedMembership.enrollmentId === enr.id, 'membership is linked to the enrollment');

    // idempotent: re-adding doesn't create a second enrollment
    await clanService.addMember(clan.id, { userId: mentee.id, role: 'mentee' });
    const enrCount = await models.Enrollment.count({ where: { menteeId: mentee.id, programId: program.id } });
    ok(enrCount === 1, 're-adding the mentee does not duplicate the enrollment');

    // ── mentee can see the assigned mentor (independent of availability) ─────
    const bookable = await schedulingService.getBookableForMentee(mentee.id);
    ok(bookable.some((b) => b.mentor.id === mentor.id), 'mentee sees the clan mentor (even with zero open slots)');

    // ── task assignment authorization (clan-aware) ──────────────────────────
    ok(await taskService._isMentorForMentee(mentor.id, mentee.id), 'mentor is authorized for the clan mentee');
    ok(!(await taskService._isMentorForMentee(mentor.id, outsider.id)), 'mentor is NOT authorized for a non-member');

    // ── mentor assigns a task → mentee sees it ──────────────────────────────
    const task = await taskService.createCustomTask({
      menteeId: mentee.id, title: 'Build the auth flow', description: 'JWT + refresh', type: 'project', pointsBase: 20
    }, mentor.id);
    created.assigned.push(task.id);
    created.roadmapTasks.push(task.roadmapTaskId);
    ok(Boolean(task) && task.menteeId === mentee.id, 'mentor successfully assigned a task to the clan mentee');

    const menteeTasks = await taskService.getMenteeTasks(mentee.id);
    ok(menteeTasks.some((t) => t.id === task.id), 'the assigned task shows up for the mentee');

    // it also shows when filtering by the mentee's active enrollment
    const byEnrollment = await taskService.getMenteeTasks(mentee.id, { enrollmentId: enr.id });
    ok(byEnrollment.some((t) => t.id === task.id), 'task is attached to the mentee active enrollment (visible with enrollment filter)');

    // ── assigning to a non-member is rejected (give outsider an enrollment so
    //    we exercise the AUTH check, not the missing-enrollment guard) ────────
    const outsiderEnr = await models.Enrollment.create({ menteeId: outsider.id, programId: program.id, status: 'active', enrolledAt: new Date() });
    created.enrollments.push(outsiderEnr.id);
    let threw = false;
    try { await taskService.createCustomTask({ menteeId: outsider.id, title: 'x', type: 'project' }, mentor.id); }
    catch (err) { threw = /not the mentor/i.test(err.message); }
    ok(threw, 'assigning to a non-member mentee is rejected on authorization');

    // ── bulk assign reports real successes ──────────────────────────────────
    const bulk = await taskService.bulkCreateCustomTasks({ menteeIds: [mentee.id], title: 'Bulk task', type: 'project' }, mentor.id);
    if (bulk.assigned !== 1) console.log('   bulk debug:', JSON.stringify(bulk.results));
    ok(bulk.assigned === 1, 'bulk assign reports 1 assigned (not silently 0)');
    const after = await taskService.getMenteeTasks(mentee.id);
    after.forEach((t) => { if (!created.assigned.includes(t.id)) { created.assigned.push(t.id); created.roadmapTasks.push(t.roadmapTaskId); } });

    console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  } catch (err) {
    console.error('FATAL', err.message, err.stack);
    fail++;
  } finally {
    try {
      await models.AssignedTask.destroy({ where: { id: created.assigned.filter(Boolean) } });
      await models.RoadmapTask.destroy({ where: { id: created.roadmapTasks.filter(Boolean) } });
      await models.ClanMembership.destroy({ where: { clanId: created.clans } });
      await models.Enrollment.destroy({ where: { menteeId: created.users } });
      await models.Clan.destroy({ where: { id: created.clans } });
      await models.Program.destroy({ where: { id: created.programs } });
      await models.User.destroy({ where: { id: created.users } });
      console.log('cleanup done');
    } catch (e2) { console.error('cleanup error', e2.message); }
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();

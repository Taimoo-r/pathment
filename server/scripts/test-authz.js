/* Synthetic test for scoped RBAC: lead vs co-mentor, clan scoping, program-scoped
 * admin, intake_manager, mentee self, super_admin. Self-cleaning.
 * Run: node scripts/test-authz.js */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Op } = require('sequelize');
const { models, sequelize } = require('../src/db');
const authz = require('../src/services/authzService');
const accessService = require('../src/services/accessService');
const authService = require('../src/services/authService');
const { ALL_PERMISSIONS } = require('../src/config/permissions');
const P = require('../src/config/permissions').PERMISSIONS;

const TAG = `authz_${Date.now()}_`;
const e = (s) => (TAG + s + '@x.io').toLowerCase();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const created = { users: [], programs: [], clans: [], memberships: [], assignments: [], customRoles: [], invites: [] };

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
    const p1 = await models.Program.create({ createdBy: admin.id, name: `${TAG}P1`, description: 'd', type: 'mentorship', status: 'published', visibility: 'private', totalDurationWeeks: 8, estimatedHoursPerWeek: 4 });
    const p2 = await models.Program.create({ createdBy: admin.id, name: `${TAG}P2`, description: 'd', type: 'mentorship', status: 'published', visibility: 'private', totalDurationWeeks: 8, estimatedHoursPerWeek: 4 });
    created.programs.push(p1.id, p2.id);
    const clanA = await models.Clan.create({ programId: p1.id, name: `${TAG}A`, createdBy: admin.id });
    const clanB = await models.Clan.create({ programId: p1.id, name: `${TAG}B`, createdBy: admin.id });
    created.clans.push(clanA.id, clanB.id);

    const lead = await mkUser('lead', ['mentor']);
    const co = await mkUser('co', ['mentor']);
    const core = await mkUser('core', ['mentee']);
    const mentee = await mkUser('mentee', ['mentee']);
    const progAdmin = await mkUser('progadmin', ['mentor']);
    const intake = await mkUser('intake', ['mentor']);
    const outsider = await mkUser('outsider', ['mentor']);

    for (const [user, role] of [[lead, 'lead_mentor'], [co, 'co_mentor'], [core, 'core_team'], [mentee, 'mentee']]) {
      const m = await models.ClanMembership.create({ clanId: clanA.id, userId: user.id, role, status: 'active' });
      created.memberships.push(m.id);
    }
    const ra1 = await models.RoleAssignment.create({ userId: progAdmin.id, role: 'program_admin', scopeType: 'program', scopeId: p1.id, grantedBy: admin.id });
    const ra2 = await models.RoleAssignment.create({ userId: intake.id, role: 'intake_manager', scopeType: 'org', grantedBy: admin.id });
    created.assignments.push(ra1.id, ra2.id);

    const inA = { clanId: clanA.id, programId: p1.id };
    const inB = { clanId: clanB.id, programId: p1.id };

    // super_admin
    ok(await authz.can(admin, P.CLAN_MANAGE_MEMBERS, inA), 'super_admin manages clan A members');
    ok(await authz.can(admin, P.SYSTEM_SETTINGS), 'super_admin has org-wide system.settings');
    const adminPerms = await authz.getEffectivePermissions(admin);
    ok(adminPerms.length === ALL_PERMISSIONS.length, 'super_admin effective = ALL permissions');

    // lead vs co (the headline)
    ok(await authz.can(lead, P.CLAN_MANAGE_MEMBERS, inA), 'lead_mentor manages members in own clan');
    ok(!(await authz.can(co, P.CLAN_MANAGE_MEMBERS, inA)), 'co_mentor CANNOT manage members');
    ok(await authz.can(co, P.TASK_REVIEW, inA), 'co_mentor reviews tasks in own clan');

    // clan scoping
    ok(!(await authz.can(lead, P.CLAN_MANAGE_MEMBERS, inB)), 'lead_mentor canNOT manage a clan they do not lead');
    ok(!(await authz.can(co, P.TASK_REVIEW, inB)), 'co_mentor canNOT review tasks in another clan');

    // core_team
    ok(await authz.can(core, P.MENTEE_VIEW, inA), 'core_team can view mentees in clan');
    ok(!(await authz.can(core, P.TASK_REVIEW, inA)), 'core_team canNOT review tasks');

    // mentee self
    ok(await authz.can(mentee, P.COMMUNITY_POST, { userId: mentee.id }), 'mentee can post (self scope)');
    ok(!(await authz.can(mentee, P.TASK_REVIEW, inA)), 'mentee canNOT review tasks');

    // program-scoped admin
    ok(await authz.can(progAdmin, P.PROGRAM_MANAGE, { programId: p1.id }), 'program_admin manages assigned program');
    ok(!(await authz.can(progAdmin, P.PROGRAM_MANAGE, { programId: p2.id })), 'program_admin canNOT manage a different program');
    ok(await authz.can(progAdmin, P.INTAKE_MANAGE, { programId: p1.id }), 'program_admin runs intake within their program');
    ok(!(await authz.can(progAdmin, P.INTAKE_MANAGE)), 'program_admin has NO org-wide intake');

    // intake_manager
    ok(await authz.can(intake, P.INTAKE_MANAGE), 'intake_manager has org-wide intake.manage');
    ok(!(await authz.can(intake, P.CLAN_MANAGE_MEMBERS, inA)), 'intake_manager canNOT manage clan members');

    // outsider
    ok(!(await authz.can(outsider, P.TASK_REVIEW, inA)), 'outsider has no clan powers');
    ok(!(await authz.can(outsider, P.INTAKE_MANAGE)), 'outsider has no admin powers');

    // custom role (admin-defined bundle), granted at clan scope
    const customRole = await models.CustomRole.create({
      key: `${TAG}ta`, label: 'TA', scopeLevel: 'clan',
      permissions: [P.TASK_REVIEW, P.MENTEE_VIEW], createdBy: admin.id
    });
    created.customRoles.push(customRole.id);
    authz.invalidateCustomRoles();
    const ta = await mkUser('ta', ['mentee']);
    const raTa = await models.RoleAssignment.create({ userId: ta.id, role: customRole.key, scopeType: 'clan', scopeId: clanA.id, grantedBy: admin.id });
    created.assignments.push(raTa.id);
    ok(await authz.can(ta, P.TASK_REVIEW, inA), 'custom role grants its permission in scoped clan');
    ok(!(await authz.can(ta, P.TASK_REVIEW, inB)), 'custom role is clan-scoped');
    ok(!(await authz.can(ta, P.CLAN_MANAGE_MEMBERS, inA)), 'custom role grants ONLY its listed permissions');

    // admin-area entry signal
    ok(await authz.hasAdminAccess(admin), 'super_admin can access admin area');
    ok(await authz.hasAdminAccess(progAdmin), 'program_admin can access admin area');
    ok(await authz.hasAdminAccess(intake), 'intake_manager can access admin area');
    ok(!(await authz.hasAdminAccess(lead)), 'lead_mentor does NOT get admin-area access');
    ok(!(await authz.hasAdminAccess(mentee)), 'mentee does NOT get admin-area access');

    // permission union ignores scope (for UI gating)
    const progUnion = await authz.getPermissionUnion(progAdmin);
    ok(progUnion.includes(P.PROGRAM_MANAGE) && progUnion.includes(P.INTAKE_MANAGE), 'program_admin union surfaces program-scoped perms');

    // invite-with-access → the pre-assigned role is applied when they register
    const inviteRes = await accessService.inviteWithRole({ email: e('invited'), baseRole: 'mentor', role: 'intake_manager', scopeType: 'org' }, admin.id);
    created.invites.push(inviteRes.invite.id);
    const rawToken = decodeURIComponent(inviteRes.inviteUrl.split('invite=')[1]);
    const reg = await authService.register({ firstName: 'In', lastName: 'Vited', email: e('invited'), password: 'SecurePass123!', confirmPassword: 'SecurePass123!', inviteToken: rawToken });
    created.users.push(reg.user.id);
    ok(await authz.hasAdminAccess(reg.user), 'invited user has admin access after registering');
    ok(await authz.can(reg.user, P.INTAKE_MANAGE), 'invited user got intake.manage from the pre-assigned role');

  } catch (err) {
    fail++;
    console.error('  ✗ threw:', err.message);
    console.error(err.stack);
  } finally {
    try {
      if (created.users.length) {
        await models.RoleAssignment.destroy({ where: { userId: { [Op.in]: created.users } } });
        await models.MentorProfile.destroy({ where: { userId: { [Op.in]: created.users } } });
        await models.MenteeProfile.destroy({ where: { userId: { [Op.in]: created.users } } });
        await models.UserSettings.destroy({ where: { userId: { [Op.in]: created.users } } });
      }
      if (created.assignments.length) await models.RoleAssignment.destroy({ where: { id: { [Op.in]: created.assignments } } });
      if (created.invites.length) await models.RegistrationInvite.destroy({ where: { id: { [Op.in]: created.invites } } });
      if (created.customRoles.length) await models.CustomRole.destroy({ where: { id: { [Op.in]: created.customRoles } } });
      if (created.memberships.length) await models.ClanMembership.destroy({ where: { id: { [Op.in]: created.memberships } } });
      if (created.clans.length) await models.Clan.destroy({ where: { id: { [Op.in]: created.clans } } });
      if (created.programs.length) await models.Program.destroy({ where: { id: { [Op.in]: created.programs } }, force: true });
      if (created.users.length) await models.User.destroy({ where: { id: { [Op.in]: created.users } }, force: true });
    } catch (cleanupErr) {
      console.error('  cleanup warning:', cleanupErr.message);
    }
    console.log(`\n${pass} passed, ${fail} failed`);
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();

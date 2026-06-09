const { catchAsync } = require('../middlewares/errorHandler');
const { successResponse } = require('../utils/responses');
const clanService = require('../services/clanService');
const clanHealthService = require('../services/clanHealthService');
const authzService = require('../services/authzService');

/**
 * GET /api/clans/health  (admin)
 * Org-wide clan-health snapshot grouped by program for the admin dashboard.
 */
const clanHealth = catchAsync(async (req, res) => {
  const health = await clanHealthService.programHealth();
  res.status(200).json(successResponse('Clan health retrieved', health));
});

/**
 * GET /api/clans/insights  (admin)
 * Worst-first clan comparison + the org fairness lens (absolute vs relative).
 */
const clanInsights = catchAsync(async (req, res) => {
  const insights = await clanHealthService.orgInsights();
  res.status(200).json(successResponse('Clan insights retrieved', insights));
});

/**
 * GET /api/clans
 * List clans (optionally filtered by program/status).
 */
const listClans = catchAsync(async (req, res) => {
  const { programId, status } = req.query;
  // A program_admin sees only their programs' clans (org admins: all).
  const programScope = await authzService.adminProgramScope(req.user, {
    assignments: req.loadAssignments ? await req.loadAssignments() : undefined
  });
  const filters = { programId, status };
  if (Array.isArray(programScope) && programScope.length) filters.programIds = programScope;
  const clans = await clanService.listClans(filters);
  res.status(200).json(successResponse('Clans retrieved', { clans }));
});

/**
 * GET /api/clans/me/memberships
 * The current user's active clan memberships (across roles).
 */
const myMemberships = catchAsync(async (req, res) => {
  const memberships = await clanService.getMembershipsForUser(req.user.id);
  res.status(200).json(successResponse('Memberships retrieved', { memberships }));
});

/**
 * GET /api/clans/mentor/programs
 * Programs the current mentor runs, each with their clans + roster counts.
 */
const mentorPrograms = catchAsync(async (req, res) => {
  const programs = await clanService.getMentorPrograms(req.user.id);
  res.status(200).json(successResponse('Mentor programs retrieved', { programs }));
});

/**
 * GET /api/clans/:id
 */
const getClan = catchAsync(async (req, res) => {
  const clan = await clanService.getClanById(req.params.id);
  res.status(200).json(successResponse('Clan retrieved', { clan }));
});

/**
 * POST /api/clans  (admin)
 */
const createClan = catchAsync(async (req, res) => {
  const clan = await clanService.createClan(req.body, req.user.id);
  res.status(201).json(successResponse('Clan created', { clan }, 201));
});

/**
 * PATCH /api/clans/:id  (admin / lead mentor)
 */
const updateClan = catchAsync(async (req, res) => {
  const clan = await clanService.updateClan(req.params.id, req.body);
  res.status(200).json(successResponse('Clan updated', { clan }));
});

/**
 * POST /api/clans/:id/members  (admin / lead mentor)
 * Assign a user to the clan with a clan-scoped role (clan-based assignment).
 */
const addMember = catchAsync(async (req, res) => {
  const membership = await clanService.addMember(req.params.id, req.body);
  res.status(201).json(successResponse('Member added', { membership }, 201));
});

/**
 * DELETE /api/clans/:id/members/:userId  (admin / lead mentor)
 */
const removeMember = catchAsync(async (req, res) => {
  const membership = await clanService.removeMember(req.params.id, req.params.userId);
  res.status(200).json(successResponse('Member removed', { membership }));
});

/**
 * GET /api/clans/:id/available  (admin / lead mentor of the clan)
 * Mentees not in any active clan, that the lead can pull into theirs.
 */
const availableMembers = catchAsync(async (req, res) => {
  const people = await clanService.listAvailableMembers({ q: req.query.q });
  res.status(200).json(successResponse('Available members', { people }));
});

/**
 * GET /api/clans/:id/candidates  (admin / lead mentor of the clan)
 * Anyone (mentor OR mentee) not already in this clan — the consistent picker for
 * adding a co-mentor / core-team member.
 */
const candidates = catchAsync(async (req, res) => {
  const people = await clanService.listCandidates(req.params.id, { q: req.query.q });
  res.status(200).json(successResponse('Candidates', { people }));
});

/**
 * POST /api/clans/:id/grants  (admin / lead mentor of the clan)
 * Delegate a CLAN-SCOPED role (built-in co_mentor/core_team or a custom clan
 * role) to a user — i.e. give them custom permissions inside this clan. Guarded
 * against privilege escalation (you can't grant more than you hold here).
 */
const grantClanRole = catchAsync(async (req, res) => {
  const accessService = require('../services/accessService');
  const assignment = await accessService.grantScopedRoleAsDelegate(
    { userId: req.body.userId, role: req.body.role, scopeType: 'clan', scopeId: req.params.id },
    req.user
  );
  res.status(201).json(successResponse('Permission granted', { assignment }, 201));
});

/**
 * DELETE /api/clans/:id/grants/:assignmentId  (admin / lead mentor of the clan)
 * Revoke a clan-scoped grant made on this clan.
 */
const revokeClanRole = catchAsync(async (req, res) => {
  const accessService = require('../services/accessService');
  await accessService.revokeClanGrant(req.params.assignmentId, req.params.id, req.user.id);
  res.status(200).json(successResponse('Permission revoked', { revoked: true }));
});

/**
 * POST /api/clans/:id/invite  (admin / lead mentor of the clan)
 * Invite a new person straight into this clan as a mentee.
 */
const inviteToClan = catchAsync(async (req, res) => {
  const invite = await clanService.inviteToClan(req.params.id, req.body.email, req.user.id);
  res.status(201).json(successResponse('Invite sent', { invite }, 201));
});

module.exports = {
  listClans,
  clanHealth,
  clanInsights,
  myMemberships,
  mentorPrograms,
  getClan,
  createClan,
  updateClan,
  addMember,
  removeMember,
  availableMembers,
  candidates,
  grantClanRole,
  revokeClanRole,
  inviteToClan
};

const authzService = require('../services/authzService');
const { AuthenticationError, AuthorizationError } = require('../utils/errors/errorTypes');

/**
 * requirePermission('task.review', scopeResolver?)
 *
 * Gate a route on a permission, optionally scoped to a resource. `scopeResolver`
 * is `(req) => descriptor | Promise<descriptor>` returning { programId?, clanId?,
 * userId? }; omit it for org-wide actions. Assignments are fetched once and
 * cached on the request so multiple checks in a chain stay cheap.
 */
function requirePermission(permission, scopeResolver = null) {
  return async (req, res, next) => {
    try {
      if (!req.user) throw new AuthenticationError('You must be logged in to access this resource');

      // Reuse the per-request memoized loader seeded by authenticate(); fall back
      // to a direct fetch if this route somehow runs without it.
      req._assignments = req.loadAssignments
        ? await req.loadAssignments()
        : (req._assignments || (await authzService.getAssignments(req.user)));
      const resource = scopeResolver ? await scopeResolver(req) : null;

      const allowed = await authzService.can(req.user, permission, resource, { assignments: req._assignments });
      if (!allowed) {
        throw new AuthorizationError('You do not have permission to perform this action');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Org-global resources (e.g. the shared library) aren't tied to one clan/program,
 * but should still require a real permission — not merely a role. This admits
 * anyone holding the permission at ANY scope (so a clan mentor with library.manage
 * @clan qualifies), while still blocking roles that lack it (e.g. analyst).
 */
function requirePermissionAnyScope(permission) {
  return async (req, res, next) => {
    try {
      if (!req.user) throw new AuthenticationError('You must be logged in to access this resource');
      const perms = await authzService.getPermissionUnion(req.user);
      if (!perms.includes(permission)) {
        throw new AuthorizationError('You do not have permission to perform this action');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Common scope resolvers for route params (and a couple body-based ones). */
const scope = {
  clan: (param = 'id') => async (req) => authzService.scopeOfClan(req.params[param]),
  program: (param = 'id') => (req) => ({ programId: req.params[param] }),
  task: (param = 'id') => async (req) => authzService.scopeOfAssignedTask(req.params[param]),
  enrollment: (param = 'id') => async (req) => authzService.scopeOfEnrollment(req.params[param]),
  submission: (param = 'submissionId') => async (req) => authzService.scopeOfSubmission(req.params[param]),
  delay: (param = 'id') => async (req) => authzService.scopeOfDelay(req.params[param]),
  announcement: (param = 'id') => async (req) => authzService.scopeOfAnnouncement(req.params[param]),
  track: (param = 'id') => async (req) => authzService.scopeOfTrack(req.params[param]),
  mentee: (param = 'id') => async (req) => authzService.scopeOfMentee(req.params[param]),
  menteeBody: (field = 'menteeId') => async (req) => authzService.scopeOfMentee(req.body && req.body[field]),
  // Task creation names its target in the body (enrollmentId or menteeId).
  taskTarget: () => async (req) =>
    req.body && req.body.enrollmentId
      ? authzService.scopeOfEnrollment(req.body.enrollmentId)
      : authzService.scopeOfMentee(req.body && req.body.menteeId),
  // Announcement creation names its audience in the body.
  announcementBody: () => async (req) =>
    authzService.scopeOfAnnouncementAudience(req.body && req.body.audience, req.body && req.body.audienceId)
};

module.exports = { requirePermission, requirePermissionAnyScope, scope };

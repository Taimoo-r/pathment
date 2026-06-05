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

      if (!req._assignments) {
        req._assignments = await authzService.getAssignments(req.user);
      }
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

/** Common scope resolvers for route params. */
const scope = {
  clan: (param = 'id') => async (req) => authzService.scopeOfClan(req.params[param]),
  program: (param = 'id') => (req) => ({ programId: req.params[param] }),
  task: (param = 'id') => async (req) => authzService.scopeOfAssignedTask(req.params[param])
};

module.exports = { requirePermission, scope };

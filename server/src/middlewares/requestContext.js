const { runWithRequestContext } = require('../utils/auditContext');

/**
 * Seed the per-request audit context (client IP + user-agent) so audit writes
 * deeper in the stack can record them. Relies on `trust proxy` being set so
 * req.ip reflects the real client behind nginx/Vercel.
 */
module.exports = function requestContext(req, res, next) {
  const ip =
    req.ip ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    (req.socket && req.socket.remoteAddress) ||
    null;
  const userAgent = req.headers['user-agent'] || null;
  runWithRequestContext({ ip, userAgent }, () => next());
};

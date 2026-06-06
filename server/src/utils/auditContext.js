const { AsyncLocalStorage } = require('async_hooks');
const { models } = require('../db');

/**
 * Per-request audit context (IP + user-agent) carried via AsyncLocalStorage, so
 * every audit write picks up "who/where" automatically without threading req
 * through dozens of service signatures. The requestContext middleware seeds it.
 */
const store = new AsyncLocalStorage();

const runWithRequestContext = (ctx, fn) => store.run(ctx, fn);
const getRequestContext = () => store.getStore() || {};

/**
 * The single audit writer. Merges IP/user-agent from the current request context
 * when the caller didn't provide them, and never throws (audit must not break a
 * real request).
 */
async function createAuditLog(data) {
  try {
    if (!models.AuditLog) return;
    const ctx = getRequestContext();
    await models.AuditLog.create({
      ...data,
      ipAddress: data.ipAddress || ctx.ip || null,
      userAgent: data.userAgent || ctx.userAgent || null,
    });
  } catch (error) {
    console.warn('Audit log failed:', error.message);
  }
}

module.exports = { runWithRequestContext, getRequestContext, createAuditLog };

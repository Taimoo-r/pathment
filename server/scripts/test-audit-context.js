/* Audit writes pick up IP + user-agent from the per-request AsyncLocalStorage
 * context, and the access-log formatter surfaces a friendly device. Self-cleaning.
 * Run: node scripts/test-audit-context.js */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');
const { runWithRequestContext, createAuditLog } = require('../src/utils/auditContext');
const security = require('../src/services/securityService');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const ids = [];

(async () => {
  try {
    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

    // Within a request context, the write should auto-capture IP + UA.
    await runWithRequestContext({ ip: '203.0.113.7', userAgent: UA }, async () => {
      await createAuditLog({ userId: null, action: 'TEST_AUDIT_CTX', entityType: 'Program', entityId: null, newValues: { name: 'Ctx Program' } });
    });
    const inCtx = await models.AuditLog.findOne({ where: { action: 'TEST_AUDIT_CTX' }, order: [['created_at', 'DESC']] });
    ids.push(inCtx.id);
    ok(inCtx.ipAddress === '203.0.113.7', 'IP captured from request context');
    ok(inCtx.userAgent === UA, 'user-agent captured from request context');

    // Outside any context, it must not throw and just stores null IP/UA.
    await createAuditLog({ userId: null, action: 'TEST_AUDIT_NOCTX', entityType: 'Program', entityId: null });
    const noCtx = await models.AuditLog.findOne({ where: { action: 'TEST_AUDIT_NOCTX' }, order: [['created_at', 'DESC']] });
    ids.push(noCtx.id);
    ok(noCtx && noCtx.ipAddress === null, 'no context → null IP (no crash)');

    // Formatter surfaces parsed device + IP + summary from the real (context) row.
    const f = security._formatAuditLog(inCtx);
    ok(f.summary === 'Ctx Program', 'formatter human summary (program name via default)');
    ok(f.device === 'Chrome on Mac', 'formatter parses device from user-agent');
    ok(f.ipAddress === '203.0.113.7', 'formatter passes through IP');
    // Mapped friendly label for a known action.
    const fProg = security._formatAuditLog({ id: 'x', action: 'PROGRAM_CREATED', entityType: 'Program', newValues: { name: 'X' }, oldValues: {}, ipAddress: null, userAgent: null, createdAt: new Date() });
    ok(fProg.label === 'Program created', 'formatter friendly label (mapped)');

    console.log(`\n${pass} passed, ${fail} failed`);
  } catch (err) {
    console.error('FATAL', err);
    fail++;
  } finally {
    for (const id of ids) await models.AuditLog.destroy({ where: { id } });
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();

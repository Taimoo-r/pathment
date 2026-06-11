/**
 * Migration: 056_product_updates
 *
 * The in-app "What's New" changelog. Admins publish human-written notes about
 * new features / improvements / fixes; users see a role-filtered feed with an
 * unread badge, and `is_major` entries pop a one-time modal on next visit.
 * `users.last_seen_changelog_at` drives the per-user unread computation.
 *
 * Run:      node server/scripts/migrations/056_product_updates.js
 * Rollback: node server/scripts/migrations/056_product_updates.js --rollback
 */
const { Sequelize } = require('sequelize');
const sequelize = require('./_db');

async function up() {
  const qi = sequelize.getQueryInterface();
  console.log('▶ Running migration 056: product_updates (What\'s New changelog)');

  const exists = await qi.showAllTables().then((t) => t.map(String).includes('product_updates'));
  if (exists) {
    console.log('  ℹ product_updates already exists, skipping table create');
  } else {
    await qi.createTable('product_updates', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      // feature | improvement | fix — drives the chip + whether it's collapsed.
      type: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'feature' },
      // Which role views this entry is relevant to.
      audience: { type: Sequelize.ARRAY(Sequelize.STRING(20)), allowNull: false, defaultValue: ['admin', 'mentor', 'mentee'] },
      // Major entries trigger the one-time "What's New" modal.
      is_major: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      action_url: { type: Sequelize.STRING(500), allowNull: true },
      action_label: { type: Sequelize.STRING(80), allowNull: true },
      // NULL = draft; set when published (the feed only shows published entries).
      published_at: { type: Sequelize.DATE, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await qi.addIndex('product_updates', ['published_at']);
    console.log('  ✓ Created product_updates');
  }

  try {
    await qi.addColumn('users', 'last_seen_changelog_at', { type: Sequelize.DATE, allowNull: true });
    console.log('  ✓ Added users.last_seen_changelog_at');
  } catch (e) {
    if (/already exists|duplicate column/i.test(e.message)) console.log('  ℹ users.last_seen_changelog_at exists, skipping');
    else throw e;
  }

  console.log('✅ Migration 056 complete');
}

async function down() {
  const qi = sequelize.getQueryInterface();
  console.log('▶ Rolling back migration 056');
  try { await qi.removeColumn('users', 'last_seen_changelog_at'); console.log('  ✓ Dropped users.last_seen_changelog_at'); }
  catch (e) { if (!/does not exist/i.test(e.message)) throw e; }
  try { await qi.dropTable('product_updates'); console.log('  ✓ Dropped product_updates'); }
  catch (e) { if (!/does not exist/i.test(e.message)) throw e; }
  console.log('✅ Rollback 056 complete');
}

if (require.main === module) {
  const isRollback = process.argv.slice(2).some((a) => a === '--rollback' || a === '-r');
  (async () => { try { await (isRollback ? down() : up()); process.exit(0); } catch (e) { console.error('❌ Migration failed:', e.message); process.exit(1); } })();
}

module.exports = { up, down };

/**
 * Migration: 057_co_mentor_permissions
 *
 * Per-co-mentor task permission overrides on clan_memberships.
 * null = all role defaults enabled.
 *
 * Run:      node server/scripts/migrations/057_co_mentor_permissions.js
 * Rollback: node server/scripts/migrations/057_co_mentor_permissions.js --rollback
 */
const { Sequelize } = require('sequelize');
const sequelize = require('./_db');

async function up() {
  const qi = sequelize.getQueryInterface();
  console.log('▶ Running migration 057: co_mentor_permissions on clan_memberships');
  try {
    await qi.addColumn('clan_memberships', 'co_mentor_permissions', {
      type: Sequelize.JSONB,
      allowNull: true
    });
    console.log('  ✓ Added clan_memberships.co_mentor_permissions');
  } catch (e) {
    if (/already exists|duplicate column/i.test(e.message)) {
      console.log('  ℹ clan_memberships.co_mentor_permissions exists, skipping');
    } else {
      throw e;
    }
  }
  console.log('✅ Migration 057 complete');
}

async function down() {
  const qi = sequelize.getQueryInterface();
  console.log('▶ Rolling back migration 057');
  try {
    await qi.removeColumn('clan_memberships', 'co_mentor_permissions');
    console.log('  ✓ Removed clan_memberships.co_mentor_permissions');
  } catch (e) {
    if (/does not exist|unknown column/i.test(e.message)) {
      console.log('  ℹ column already absent, skipping');
    } else {
      throw e;
    }
  }
  console.log('✅ Rollback 057 complete');
}

if (require.main === module) {
  const rollback = process.argv.includes('--rollback');
  (rollback ? down() : up())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { up, down };

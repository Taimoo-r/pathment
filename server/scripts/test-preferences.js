/* Verifies user_settings.preferences group-merge semantics (settings saves).
 * Run: node scripts/test-preferences.js  (self-cleans) */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');

const TAG = `pref_${Date.now()}_`;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const created = { users: [] };

// Mirror profileController.updatePreferences merge.
async function savePrefs(userId, group, values) {
  const [s] = await models.UserSettings.findOrCreate({ where: { userId }, defaults: { userId } });
  const cur = s.preferences && typeof s.preferences === 'object' ? s.preferences : {};
  await s.update({ preferences: { ...cur, [group]: { ...(cur[group] || {}), ...values } } });
  return s.preferences;
}

(async () => {
  try {
    const u = await models.User.create({ email: (TAG + 'u@x.io').toLowerCase(), passwordHash: 'x', role: 'admin', capabilities: ['admin'], firstName: 'Pref', lastName: 'T', emailVerified: true, status: 'active' });
    created.users.push(u.id);

    await savePrefs(u.id, 'notifications', { emailNotifications: false, weeklyReports: true });
    await savePrefs(u.id, 'system', { maintenanceMode: true });
    await savePrefs(u.id, 'notifications', { weeklyReports: false }); // partial update same group

    const s = await models.UserSettings.findOne({ where: { userId: u.id } });
    ok(s.preferences.notifications.emailNotifications === false, 'notifications.emailNotifications persisted');
    ok(s.preferences.notifications.weeklyReports === false, 'partial group update merges (weeklyReports flipped)');
    ok(s.preferences.system.maintenanceMode === true, 'separate group (system) untouched by notifications update');

    // getProfile-style read includes preferences.
    const profile = await models.User.findByPk(u.id, {
      include: [{ model: models.UserSettings, as: 'settings', required: false, attributes: ['preferences', 'colorTheme', 'theme'] }],
    });
    ok(profile.settings?.preferences?.system?.maintenanceMode === true, 'getProfile read returns preferences');

    console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  } catch (err) {
    console.error('FATAL', err.message, err.stack);
    fail++;
  } finally {
    try {
      await models.UserSettings.destroy({ where: { userId: created.users } }).catch(() => {});
      await models.User.destroy({ where: { id: created.users } }).catch(() => {});
      console.log('cleanup done');
    } catch (e2) { console.error('cleanup error', e2.message); }
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();

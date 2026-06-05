/* Verifies (17) profile location/extra details + skills persistence:
 * users.city/country/languages, user_settings.timezone upsert, mentee
 * portfolio_url, and UserSkill bulk save + read with proficiency.
 * Run: node scripts/test-profile-skills.js  (self-cleans) */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');

const TAG = `ps_${Date.now()}_`;
const e = (s) => (TAG + s + '@x.io').toLowerCase();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const created = { users: [], skills: [] };

(async () => {
  try {
    const user = await models.User.create({ email: e('mentee'), passwordHash: 'x', role: 'mentee', capabilities: ['mentee'], firstName: 'Loc', lastName: 'Test', emailVerified: true, status: 'active' });
    created.users.push(user.id);
    await models.MenteeProfile.create({ userId: user.id });

    // ── Location + extra details on the user ─────────────────────────────────
    await user.update({ city: 'Lahore', country: 'Pakistan', languages: ['English', 'Urdu'] });
    const fresh = await models.User.findByPk(user.id);
    ok(fresh.city === 'Lahore' && fresh.country === 'Pakistan', 'city + country persist on user');
    ok(Array.isArray(fresh.languages) && fresh.languages.length === 2 && fresh.languages.includes('Urdu'), 'languages array persists');

    // ── Timezone upsert on user_settings ─────────────────────────────────────
    const [settings] = await models.UserSettings.findOrCreate({ where: { userId: user.id }, defaults: { userId: user.id } });
    await settings.update({ timezone: 'Asia/Karachi' });
    const s = await models.UserSettings.findOne({ where: { userId: user.id } });
    ok(s.timezone === 'Asia/Karachi', 'timezone upserts on user_settings');

    // ── Mentee portfolio_url (was a schema gap) ──────────────────────────────
    await models.MenteeProfile.update({ portfolioUrl: 'https://me.dev' }, { where: { userId: user.id } });
    const mp = await models.MenteeProfile.findOne({ where: { userId: user.id } });
    ok(mp.portfolioUrl === 'https://me.dev', 'mentee portfolio_url persists');

    // ── Skills: bulk save + read with proficiency ────────────────────────────
    const sk1 = await models.Skill.create({ name: TAG + 'React', category: 'frontend' });
    const sk2 = await models.Skill.create({ name: TAG + 'Node', category: 'backend' });
    created.skills.push(sk1.id, sk2.id);
    // Mirror profileController.addUserSkills: replace all then bulkCreate.
    await models.UserSkill.destroy({ where: { userId: user.id } });
    await models.UserSkill.bulkCreate([
      { userId: user.id, skillId: sk1.id, proficiencyLevel: 75 },
      { userId: user.id, skillId: sk2.id, proficiencyLevel: 50 },
    ]);

    // Read back the way GET /skills/user does.
    const withSkills = await models.User.findByPk(user.id, {
      include: [{ model: models.Skill, as: 'skills', through: { attributes: ['proficiencyLevel'] } }],
    });
    ok(withSkills.skills.length === 2, 'user has 2 skills after save');
    const react = withSkills.skills.find((x) => x.id === sk1.id);
    ok(react && Number(react.UserSkill.proficiencyLevel) === 75, 'proficiency level reads back (75)');

    // Replace (remove one) — bulk replace semantics.
    await models.UserSkill.destroy({ where: { userId: user.id } });
    await models.UserSkill.bulkCreate([{ userId: user.id, skillId: sk1.id, proficiencyLevel: 100 }]);
    const after = await models.UserSkill.findAll({ where: { userId: user.id } });
    ok(after.length === 1 && Number(after[0].proficiencyLevel) === 100, 'bulk-replace updates the skill set');

    // ── getProfile-style read includes settings ──────────────────────────────
    const profile = await models.User.findByPk(user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { model: models.MenteeProfile, as: 'menteeProfile', required: false },
        { model: models.Skill, as: 'skills', through: { attributes: ['proficiencyLevel'] } },
        { model: models.UserSettings, as: 'settings', required: false, attributes: ['timezone', 'language'] },
      ],
    });
    ok(profile.settings && profile.settings.timezone === 'Asia/Karachi', 'getProfile read includes settings.timezone');
    ok(profile.city === 'Lahore' && profile.menteeProfile.portfolioUrl === 'https://me.dev', 'getProfile read carries city + portfolio');

    console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  } catch (err) {
    console.error('FATAL', err.message, err.stack);
    fail++;
  } finally {
    try {
      await models.UserSkill.destroy({ where: { userId: created.users } }).catch(() => {});
      await models.Skill.destroy({ where: { id: created.skills } }).catch(() => {});
      await models.UserSettings.destroy({ where: { userId: created.users } }).catch(() => {});
      await models.MenteeProfile.destroy({ where: { userId: created.users } }).catch(() => {});
      await models.User.destroy({ where: { id: created.users } }).catch(() => {});
      console.log('cleanup done');
    } catch (e2) { console.error('cleanup error', e2.message); }
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();

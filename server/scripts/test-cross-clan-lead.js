/* Lead-mentor cross-clan cover: the route gates POST/GET/DELETE on
 * CLAN_MANAGE_MEMBERS scoped to the TARGET clan (scopeOfClan). This proves the
 * lead of a clan passes that gate for their clan, a co-mentor does not, and that
 * creating cover actually grants the helper co_mentor on the target clan and
 * listCrossClanForClan surfaces it. Self-cleaning. Run: node scripts/test-cross-clan-lead.js */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');
const authz = require('../src/services/authzService');
const svc = require('../src/services/clanRequestsService');
const P = require('../src/config/permissions').PERMISSIONS;

const TAG = `xclan_${Date.now()}_`;
const e = (s) => (TAG + s + '@x.io').toLowerCase();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const created = { users: [], programs: [], clans: [], memberships: [], cross: [] };

const mkUser = async (first) => {
  const u = await models.User.create({ email: e(first), passwordHash: 'x', role: 'mentor', capabilities: ['mentor'], firstName: first, lastName: 'T', emailVerified: true, status: 'active' });
  created.users.push(u.id);
  return u;
};

(async () => {
  try {
    const admin = await models.User.create({ email: e('admin'), passwordHash: 'x', role: 'admin', capabilities: ['admin'], firstName: 'Adm', lastName: 'T', emailVerified: true, status: 'active' });
    created.users.push(admin.id);
    const prog = await models.Program.create({ createdBy: admin.id, name: `${TAG}P`, description: 'd', type: 'mentorship', status: 'published', visibility: 'private', totalDurationWeeks: 8, estimatedHoursPerWeek: 4 });
    created.programs.push(prog.id);
    const clanA = await models.Clan.create({ programId: prog.id, name: `${TAG}A`, createdBy: admin.id });
    const clanB = await models.Clan.create({ programId: prog.id, name: `${TAG}B`, createdBy: admin.id });
    created.clans.push(clanA.id, clanB.id);

    const lead = await mkUser('lead');   // leads clan A
    const co = await mkUser('co');       // co-mentor in clan A
    const helper = await mkUser('helper'); // an outsider who will cover clan A
    for (const [u, r] of [[lead, 'lead_mentor'], [co, 'co_mentor']]) {
      const m = await models.ClanMembership.create({ clanId: clanA.id, userId: u.id, role: r, status: 'active' });
      created.memberships.push(m.id);
    }

    const scopeA = await authz.scopeOfClan(clanA.id);
    const scopeB = await authz.scopeOfClan(clanB.id);

    // The exact gate the route applies: CLAN_MANAGE_MEMBERS on the target-clan scope.
    ok(await authz.can(lead, P.CLAN_MANAGE_MEMBERS, scopeA), 'lead passes the cross-clan gate for THEIR clan');
    ok(!(await authz.can(lead, P.CLAN_MANAGE_MEMBERS, scopeB)), 'lead is denied requesting cover for ANOTHER clan');
    ok(!(await authz.can(co, P.CLAN_MANAGE_MEMBERS, scopeA)), 'co-mentor is denied requesting cover');
    ok(await authz.can(admin, P.CLAN_MANAGE_MEMBERS, scopeA), 'admin passes the gate org-wide');

    // helper has nothing on clan A before cover
    ok(!(await authz.can(helper, P.TASK_REVIEW, scopeA)), 'helper has NO clan-A access before cover');

    // Lead creates cover (toClanId = clan A) — consent-first, so it starts PENDING.
    const a = await svc.createCrossClan({ kind: 'cover', userId: helper.id, toClanId: clanA.id, note: 'on leave' }, lead.id);
    created.cross.push(a.id);
    ok(a.status === 'pending', 'lead-created cover starts as PENDING (needs acceptance)');
    ok(!(await authz.can(helper, P.TASK_REVIEW, scopeA)), 'pending cover grants NOTHING yet');

    // Helper sees it in their own inbox.
    const mine = await svc.listMyCrossClan(helper.id);
    ok(mine.length === 1 && mine[0].status === 'pending', 'helper sees the pending request in listMyCrossClan');

    // Only the addressee can respond.
    let blocked = false;
    try { await svc.respondToCrossClan(a.id, co.id, true); } catch { blocked = true; }
    ok(blocked, 'a different user cannot accept someone else’s cover request');

    // Helper accepts → now active → access granted.
    const resp = await svc.respondToCrossClan(a.id, helper.id, true);
    ok(resp.status === 'active', 'accepting flips status to active');
    ok(await authz.can(helper, P.TASK_REVIEW, scopeA), 'helper CAN review clan-A tasks AFTER accepting');
    ok(!(await authz.can(helper, P.CLAN_MANAGE_MEMBERS, scopeA)), 'cover does NOT make helper a lead');

    // Can't respond twice.
    let twice = false;
    try { await svc.respondToCrossClan(a.id, helper.id, false); } catch { twice = true; }
    ok(twice, 'cannot respond to an already-answered request');

    // Notifications: request to helper, oversight to admin, acceptance back to lead.
    const helperNote = await models.Notification.findOne({ where: { userId: helper.id, relatedEntityType: 'cross_clan_assignment', relatedEntityId: a.id } });
    ok(Boolean(helperNote), 'helper receives the cover request notification');
    const adminNote = await models.Notification.findOne({ where: { userId: admin.id, relatedEntityType: 'cross_clan_assignment', relatedEntityId: a.id } });
    ok(Boolean(adminNote), 'admin receives an oversight notification (lead arranged it)');
    const acceptNote = await models.Notification.findOne({ where: { userId: lead.id, relatedEntityType: 'cross_clan_response', relatedEntityId: a.id } });
    ok(Boolean(acceptNote), 'requesting lead is notified of the acceptance');

    // Admin-created cover is active immediately (no acceptance needed).
    const b = await svc.createCrossClan({ kind: 'specialist', userId: co.id, toClanId: clanB.id }, admin.id);
    created.cross.push(b.id);
    ok(b.status === 'active', 'admin-created cover is active immediately');

    // listCrossClanForClan surfaces it for the lead's view, with status.
    const rows = await svc.listCrossClanForClan(clanA.id);
    ok(rows.length === 1 && rows[0].id === a.id && rows[0].status === 'active', 'listCrossClanForClan returns the assignment with status');
    ok(rows[0].toClan === `${TAG}A` && /helper/i.test(rows[0].user || ''), 'row carries helper + target-clan names');

    // DELETE resolver scope = assignment.toClanId → still clan A → lead passes
    const loaded = await models.CrossClanAssignment.findByPk(a.id);
    ok((await authz.scopeOfClan(loaded.toClanId)).clanId === clanA.id, 'delete resolver scopes to the assignment target clan');

    await svc.removeCrossClan(a.id, lead.id);
    created.cross = created.cross.filter((id) => id !== a.id);
    ok(!(await authz.can(helper, P.TASK_REVIEW, scopeA)), 'cover removed → helper loses clan-A access');
    const removalNote = await models.Notification.findOne({ where: { userId: helper.id, relatedEntityType: 'cross_clan_removed', relatedEntityId: a.id } });
    ok(Boolean(removalNote), 'helper is notified when their cover is removed');

    console.log(`\n${pass} passed, ${fail} failed`);
  } catch (err) {
    console.error('FATAL', err);
    fail++;
  } finally {
    for (const id of created.users) await models.Notification.destroy({ where: { userId: id } });
    for (const id of created.cross) await models.CrossClanAssignment.destroy({ where: { id } });
    for (const id of created.memberships) await models.ClanMembership.destroy({ where: { id } });
    for (const id of created.clans) await models.Clan.destroy({ where: { id } });
    for (const id of created.programs) await models.Program.destroy({ where: { id } });
    for (const id of created.users) await models.User.destroy({ where: { id } });
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();

/* Synthetic E2E for community v2. Creates an isolated program/clan/cohort with
 * a mentor + two mentees + an outsider, exercises every service path, and
 * cleans up. Run: node scripts/test-community-v2.js */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');
const community = require('../src/services/communityService');
const spaceSvc = require('../src/services/communitySpaceService');
const scheduler = require('../src/services/notificationScheduler');

const TAG = `cmtytest_${Date.now()}_`;
const e = (s) => (TAG + s + '@x.io').toLowerCase();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const created = { users: [], profiles: [], programs: [], clans: [], cohorts: [], memberships: [], enrollments: [], posts: [], comments: [], reactions: [], reports: [] };

async function mkUser(first, caps) {
  const u = await models.User.create({
    email: e(first), passwordHash: 'x', role: caps[0], capabilities: caps,
    firstName: first, lastName: 'T', emailVerified: true, status: 'active'
  });
  created.users.push(u.id);
  return u;
}

(async () => {
  try {
    // ── fixtures ──────────────────────────────────────────────────────────
    const admin = await mkUser('admin', ['admin']);
    const mentor = await mkUser('mentor', ['mentor']);
    const menteeA = await mkUser('menteeA', ['mentee']);
    const menteeB = await mkUser('menteeB', ['mentee']);
    const outsider = await mkUser('outsider', ['mentee']);

    for (const u of [menteeA, menteeB, outsider]) {
      const p = await models.MenteeProfile.create({ userId: u.id, totalPoints: 0 });
      created.profiles.push(p.id);
    }

    const program = await models.Program.create({
      createdBy: admin.id, name: TAG + 'prog', description: 'd', type: 'mentorship', totalDurationWeeks: 12, status: 'published', visibility: 'private'
    });
    created.programs.push(program.id);
    const cohort = await models.Cohort.create({ programId: program.id, name: TAG + 'cohort', status: 'running', createdBy: admin.id });
    created.cohorts.push(cohort.id);
    const clan = await models.Clan.create({ programId: program.id, name: TAG + 'clan', createdBy: admin.id, leadMentorId: mentor.id });
    created.clans.push(clan.id);

    const mkMem = async (u, role) => { const m = await models.ClanMembership.create({ clanId: clan.id, userId: u.id, role, status: 'active' }); created.memberships.push(m.id); };
    await mkMem(mentor, 'lead_mentor');
    await mkMem(menteeA, 'mentee');
    await mkMem(menteeB, 'mentee');

    const mkEnr = async (u) => { const en = await models.Enrollment.create({ menteeId: u.id, programId: program.id, cohortId: cohort.id, status: 'active' }); created.enrollments.push(en.id); };
    await mkEnr(menteeA);
    await mkEnr(menteeB);
    await mkEnr(outsider); // enrolled in program but NOT in the clan

    // ── spaces ──────────────────────────────────────────────────────────
    const spacesA = await spaceSvc.listSpaces(menteeA);
    ok(spacesA.some(s => s.type === 'clan' && s.id === clan.id), 'menteeA sees clan space');
    ok(spacesA.some(s => s.type === 'cohort' && s.id === cohort.id), 'menteeA sees cohort space');
    ok(spacesA.some(s => s.type === 'program' && s.id === program.id), 'menteeA sees program space');
    ok(spacesA.some(s => s.type === 'global'), 'menteeA sees global lounge');

    const spacesM = await spaceSvc.listSpaces(mentor);
    const mentorClan = spacesM.find(s => s.type === 'clan' && s.id === clan.id);
    ok(mentorClan && mentorClan.isModerator, 'mentor is moderator of clan space');
    ok(spacesM.some(s => s.type === 'cohort' && s.id === cohort.id), 'mentor sees the cohort space of their program');

    ok(!(await spaceSvc.canAccess(outsider, 'clan', clan.id)), 'outsider has NO access to the clan space');
    ok(await spaceSvc.canAccess(outsider, 'program', program.id), 'outsider (enrolled) can access program space');
    ok(await spaceSvc.canAccess(admin, 'clan', clan.id), 'admin can access any space');

    // ── posting + scoping ────────────────────────────────────────────────
    const q = await community.createPost(menteeA, { type: 'question', scopeType: 'clan', scopeId: clan.id, title: 'How do I deploy?', body: 'Stuck on deploy', tags: ['deploy', 'devops'] });
    created.posts.push(q.id);
    ok(q && q.scopeType === 'clan', 'menteeA posted a question to the clan space');

    let threw = false;
    try { await community.createPost(outsider, { type: 'win', scopeType: 'clan', scopeId: clan.id, body: 'sneaky' }); } catch { threw = true; }
    ok(threw, 'outsider CANNOT post into the clan space (access enforced)');

    const feedB = await community.feed(menteeB, { scopeType: 'clan', scopeId: clan.id });
    ok(feedB.feed.some(p => p.id === q.id), 'menteeB sees the question in the clan feed');
    ok(feedB.stats.openQuestions === 1, 'clan feed reports 1 open question');

    let feedThrew = false;
    try { await community.feed(outsider, { scopeType: 'clan', scopeId: clan.id }); } catch { feedThrew = true; }
    ok(feedThrew, 'outsider CANNOT read the clan feed');

    // ── threads + Q&A ─────────────────────────────────────────────────────
    const ans = await community.addComment(menteeB, q.id, { body: 'Use the deploy script' });
    created.comments.push(ans.id);
    const reloadedQ = await models.CommunityPost.findByPk(q.id);
    ok(reloadedQ.commentCount === 1, 'comment_count incremented to 1');

    const comments = await community.listComments(menteeA, q.id);
    ok(comments.length === 1 && comments[0].id === ans.id, 'menteeA can list the answer');

    const profBefore = await models.MenteeProfile.findOne({ where: { userId: menteeB.id } });
    await community.acceptAnswer(menteeA, q.id, ans.id);
    const afterAccept = await models.CommunityPost.findByPk(q.id);
    ok(afterAccept.resolved && afterAccept.acceptedCommentId === ans.id, 'question marked resolved with accepted answer');
    const profAfter = await models.MenteeProfile.findOne({ where: { userId: menteeB.id } });
    ok(Number(profAfter.totalPoints) > Number(profBefore.totalPoints), 'answer author (menteeB) earned points');

    let acceptThrew = false;
    try { await community.acceptAnswer(menteeB, q.id, ans.id); } catch { acceptThrew = true; }
    ok(acceptThrew, 'a non-asker non-moderator cannot accept an answer');

    // ── kudos + points ────────────────────────────────────────────────────
    const pb = await models.MenteeProfile.findOne({ where: { userId: menteeB.id } });
    const kudos = await community.createPost(menteeA, { type: 'kudos', scopeType: 'clan', scopeId: clan.id, body: 'great help!', toId: menteeB.id });
    created.posts.push(kudos.id);
    const pa = await models.MenteeProfile.findOne({ where: { userId: menteeB.id } });
    ok(Number(pa.totalPoints) > Number(pb.totalPoints), 'kudos recipient earned points');

    const feedAfterKudos = await community.feed(menteeB, { scopeType: 'clan', scopeId: clan.id });
    ok(feedAfterKudos.shoutouts.some(s => s.id === kudos.id), 'kudos appears in recipient shoutouts');

    // ── reactions ──────────────────────────────────────────────────────────
    const r1 = await community.toggleReaction(menteeB, q.id, 'helpful');
    ok(r1.reacted === true, 'reaction added (helpful)');
    const r2 = await community.toggleReaction(menteeB, q.id, 'helpful');
    ok(r2.reacted === false, 'reaction toggled off');
    await community.toggleReaction(menteeB, q.id, 'celebrate');
    const feedReact = await community.feed(menteeA, { scopeType: 'clan', scopeId: clan.id });
    const qInFeed = feedReact.feed.find(p => p.id === q.id);
    ok(qInFeed && qInFeed.reactions.celebrate === 1, 'broadened reaction type (celebrate) counted');

    // ── pinning (moderator only) ────────────────────────────────────────
    let pinDenied = false;
    try { await community.setPinned(menteeA, q.id, true); } catch { pinDenied = true; }
    ok(pinDenied, 'mentee cannot pin');
    await community.setPinned(mentor, q.id, true);
    const pinnedFeed = await community.feed(menteeA, { scopeType: 'clan', scopeId: clan.id });
    ok(pinnedFeed.feed[0].id === q.id && pinnedFeed.feed[0].pinned, 'mentor pinned the post; it sorts first');

    // ── search + tag filter ────────────────────────────────────────────────
    const searchFeed = await community.feed(menteeA, { scopeType: 'clan', scopeId: clan.id, q: 'deploy' });
    ok(searchFeed.feed.some(p => p.id === q.id), 'search matches question by text');
    const tagFeed = await community.feed(menteeA, { scopeType: 'clan', scopeId: clan.id, tag: 'devops' });
    ok(tagFeed.feed.some(p => p.id === q.id), 'tag filter matches');

    // ── members + people ────────────────────────────────────────────────
    const members = await community.getMembers(menteeA, 'clan', clan.id);
    ok(members.length === 3, 'clan has 3 members listed');
    const people = await community.getPeople(menteeA, 'clan', clan.id);
    ok(people.length === 2 && !people.some(p => p.id === menteeA.id), 'people list excludes self');

    // ── moderation: report → admin resolve ─────────────────────────────────
    const rep = await community.report(menteeB, { targetType: 'post', targetId: q.id, reason: 'test' });
    ok(rep.reported, 'member can report a post');
    const reports = await community.listReports(admin, { status: 'open' });
    const myRep = reports.find(r => r.targetId === q.id);
    created.reports.push(...reports.filter(r => r.targetId === q.id || r.targetId === kudos.id).map(r => r.id));
    ok(Boolean(myRep), 'admin sees the open report');
    await community.resolveReport(admin, myRep.id, 'reviewed');
    const openAfter = await community.listReports(admin, { status: 'open' });
    ok(!openAfter.some(r => r.id === myRep.id), 'resolved report leaves the open queue');

    // ── @mention sanitization (only space members are kept) ────────────────
    const mentionPost = await community.createPost(menteeA, {
      type: 'discussion', scopeType: 'clan', scopeId: clan.id, body: 'ping',
      mentionedUserIds: [menteeB.id, outsider.id]
    });
    created.posts.push(mentionPost.id);
    const reloadedMention = await models.CommunityPost.findByPk(mentionPost.id);
    ok(reloadedMention.mentionedUserIds.includes(menteeB.id), 'mention to a clan member is kept');
    ok(!reloadedMention.mentionedUserIds.includes(outsider.id), 'mention to a non-member is dropped');

    // ── report preview (moderation queue shows target content) ──────────────
    await community.report(menteeB, { targetType: 'post', targetId: q.id, reason: 'preview check' });
    const repList = await community.listReports(admin, { status: 'open' });
    const qRep = repList.find(r => r.targetId === q.id);
    ok(qRep && /deploy/i.test(qRep.preview), 'report carries a content preview');
    ok(qRep && qRep.targetAuthor && qRep.targetAuthor.includes('menteeA'), 'report shows the target author');

    // ── weekly standup auto-post (scoped to our clan; idempotent) ───────────
    const postedN = await scheduler._postStandupsToActiveClans([clan.id]);
    ok(postedN === 1, 'standup posted to the active clan');
    const standup = await models.CommunityPost.findOne({ where: { scopeType: 'clan', scopeId: clan.id, type: 'standup' } });
    ok(Boolean(standup), 'standup post exists in the clan space');
    const postedAgain = await scheduler._postStandupsToActiveClans([clan.id]);
    ok(postedAgain === 0, 'standup is idempotent within the week');

    // ── community contribution leaderboard ──────────────────────────────────
    const lb = await community.getLeaderboard(menteeA, { scopeType: 'clan', scopeId: clan.id, period: 'all' });
    ok(Array.isArray(lb.leaderboard) && lb.leaderboard.length > 0, 'community leaderboard returns ranked contributors');
    ok(lb.leaderboard.some(r => r.userId === menteeB.id && r.points > 0 && r.tier), 'a member who got kudos + an accepted answer ranks with points + a tier');
    ok(lb.me && lb.me.userId === menteeA.id, 'leaderboard includes the requester own standing');

    // ── soft delete ─────────────────────────────────────────────────────
    await community.deletePost(menteeA, kudos.id);
    const feedDel = await community.feed(menteeA, { scopeType: 'clan', scopeId: clan.id });
    ok(!feedDel.feed.some(p => p.id === kudos.id), 'soft-deleted post no longer appears');

    console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  } catch (err) {
    console.error('FATAL', err.message, err.stack);
    fail++;
  } finally {
    // ── cleanup ───────────────────────────────────────────────────────────
    try {
      await models.CommunityReport.destroy({ where: { reporterId: created.users } });
      // Posts created directly (tracked) + any scheduler-created standups in our clans.
      const clanPosts = created.clans.length ? await models.CommunityPost.findAll({ where: { scopeId: created.clans }, attributes: ['id'] }) : [];
      const allPostIds = [...new Set([...created.posts, ...clanPosts.map(p => p.id)])];
      await models.CommunityComment.destroy({ where: { postId: allPostIds } });
      await models.CommunityReaction.destroy({ where: { postId: allPostIds } });
      await models.CommunityPost.destroy({ where: { id: allPostIds } });
      await models.Enrollment.destroy({ where: { id: created.enrollments } });
      await models.ClanMembership.destroy({ where: { id: created.memberships } });
      await models.Clan.destroy({ where: { id: created.clans } });
      await models.Cohort.destroy({ where: { id: created.cohorts } });
      await models.PointsHistory.destroy({ where: { userId: created.users } });
      await models.LeaderboardEntry.destroy({ where: { userId: created.users } }).catch(() => {});
      await models.MenteeProfile.destroy({ where: { id: created.profiles } });
      await models.Program.destroy({ where: { id: created.programs } });
      await models.User.destroy({ where: { id: created.users } });
      console.log('cleanup done');
    } catch (e) { console.error('cleanup error', e.message); }
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();

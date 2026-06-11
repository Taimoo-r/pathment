/**
 * Seed the "What's New" changelog with ready-to-review DRAFTS.
 *
 * Every entry is created unpublished (published_at = NULL) so nothing shows to
 * users until an admin reviews and hits Publish. Idempotent: an entry whose
 * title already exists is skipped, so re-running never duplicates.
 *
 * Run: node server/scripts/seed-changelog.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');

const ALL = ['admin', 'mentor', 'mentee'];

const ENTRIES = [
  // ── Major (these pop the one-time modal once published) ──────────────────────
  {
    title: 'Personalize any task for a single mentee',
    type: 'feature', audience: ['mentor'], isMajor: true,
    body: `<p>When you assign a task from a roadmap, you can now tailor it for one mentee without changing it for everyone else. Edit the title, rewrite the brief, swap in different resources, and add a private note just for them.</p><p>Made a mistake? You can edit it later, unassign it, or assign it again — all with your own notes. Each mentee gets exactly the guidance that fits them.</p>`,
  },
  {
    title: 'Run your weekly cohort reviews in one place',
    type: 'feature', audience: ['mentor'], isMajor: true,
    body: `<p>Cohort Review gives you a single screen to run your weekly check-ins: take attendance, see where each mentee stands, and assign tasks on the spot.</p><p>Reviews are only created once you actually start one — so you won't get accidental empty sessions. And if one does get created by mistake, you can now delete it cleanly from your history.</p>`,
  },
  {
    title: 'Lead more than one clan? Switch between them easily',
    type: 'feature', audience: ['mentor'], isMajor: true,
    body: `<p>If you mentor more than one clan, there's now a simple switcher in the sidebar. Pick a clan and your dashboard, messages, and community feed all focus on just that group — so nothing gets mixed up when you're juggling several teams.</p>`,
  },
  {
    title: 'Give your team the right access — safely',
    type: 'feature', audience: ['admin'], isMajor: true,
    body: `<p>A new Roles &amp; Access area lets you control exactly what each admin and mentor can do, and limit it to the right program or clan. For example, a program admin only sees and manages their own program.</p><p>You can grant and remove access whenever you need, and every change is recorded.</p>`,
  },

  // ── Improvements ─────────────────────────────────────────────────────────────
  {
    title: 'Build and reuse roadmaps faster',
    type: 'improvement', audience: ['admin', 'mentor'], isMajor: false,
    body: `<p>Creating and editing roadmaps is now smoother with a dedicated editor, and each step can include its own resources (links, files, references). You can also export a roadmap and import it elsewhere, so you don't have to rebuild the same plan twice.</p>`,
  },
  {
    title: 'Custom tasks now match roadmap tasks',
    type: 'improvement', audience: ['mentor'], isMajor: false,
    body: `<p>When you create a one-off task, you can now add resources and a properly formatted brief — the same rich options you get with roadmap tasks. Your mentees see a clear, well-laid-out task instead of plain text.</p>`,
  },
  {
    title: 'Find people fast on the Invites and Clans pages',
    type: 'improvement', audience: ['admin'], isMajor: false,
    body: `<p>The Invites and Clans lists now have search and filters (by program and clan), plus paging so long lists stay quick and easy to scan — even as your numbers grow.</p>`,
  },
  {
    title: 'Assign to many mentees at once',
    type: 'improvement', audience: ['mentor'], isMajor: false,
    body: `<p>You can now search for mentees and select several at a time when assigning from a roadmap, then assign to all of them in one go — instead of one by one.</p>`,
  },
  {
    title: 'Set and change task deadlines',
    type: 'improvement', audience: ['mentor'], isMajor: false,
    body: `<p>Tasks now support clear deadlines you can set and adjust, and you can unassign a task if plans change.</p>`,
  },
  {
    title: 'Easier on the eyes in dark mode',
    type: 'improvement', audience: ALL, isMajor: false,
    body: `<p>We polished dark mode across task descriptions, clan cards, and progress indicators so everything is comfortable to read at night.</p>`,
  },

  // ── Fixes (collapsed under "Also fixed") ─────────────────────────────────────
  {
    title: 'Meeting bookings now notify both people — no double-bookings',
    type: 'fix', audience: ['mentor', 'mentee'], isMajor: false,
    body: `<p>When a meeting is booked, both the mentor and the mentee get a notification and email confirmation. We also fixed a rare case where the same slot could be booked twice.</p>`,
  },
  {
    title: 'Important emails always arrive quickly',
    type: 'fix', audience: ALL, isMajor: false,
    body: `<p>Account emails you can't log in without — password resets, email verification, and invitations — now always send right away and are never delayed behind routine emails.</p>`,
  },
  {
    title: 'Moving a mentee to the right clan',
    type: 'fix', audience: ['admin'], isMajor: false,
    body: `<p>Placed someone in the wrong clan? You can now reassign a mentee to a different clan in a couple of clicks, and the directory clearly shows each mentee's current clan.</p>`,
  },
  {
    title: 'Suspended members can be brought back',
    type: 'fix', audience: ['admin'], isMajor: false,
    body: `<p>Fixed an issue where suspended users disappeared from the directory, which made it impossible to un-suspend them. They now stay visible so you can restore access.</p>`,
  },
  {
    title: 'Dashboard numbers are accurate again',
    type: 'fix', audience: ['admin'], isMajor: false,
    body: `<p>Fixed a glitch where the dashboard could show 0 active mentees even when clans were full. Your totals now reflect reality.</p>`,
  },
  {
    title: 'Clearer password rules when signing up',
    type: 'fix', audience: ALL, isMajor: false,
    body: `<p>Sign-up and password-reset screens now show the password requirements as you type, so there's no guessing why a password was rejected.</p>`,
  },
];

async function run() {
  // Make sure the table exists locally (no-op if it does; creates only this table).
  await models.ProductUpdate.sync();

  let created = 0, skipped = 0;
  for (const e of ENTRIES) {
    const existing = await models.ProductUpdate.findOne({ where: { title: e.title } });
    if (existing) { skipped++; console.log(`  ⏭  exists: ${e.title}`); continue; }
    await models.ProductUpdate.create({ ...e, publishedAt: null, createdBy: null });
    created++;
    console.log(`  ✓ draft: ${e.title}`);
  }
  console.log(`\n✅ Done — ${created} draft(s) created, ${skipped} skipped. Review + publish at /admin/changelog.`);
}

run()
  .then(() => sequelize.close())
  .then(() => process.exit(0))
  .catch((err) => { console.error('❌ Seed failed:', err.message); process.exit(1); });

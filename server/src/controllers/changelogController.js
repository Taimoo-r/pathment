const { catchAsync } = require('../middlewares/errorHandler');
const { successResponse } = require('../utils/responses');
const changelogService = require('../services/changelogService');

// ── User-facing "What's New" feed ─────────────────────────────────────────────

// GET /api/changelog?role=mentor — role-filtered feed + unread count + unseen majors.
const feed = catchAsync(async (req, res) => {
  const data = await changelogService.feedForUser(req.user, req.query.role);
  res.status(200).json(successResponse('Changelog retrieved', data));
});

// POST /api/changelog/seen — mark the whole feed as seen (clears badge + modal).
const markSeen = catchAsync(async (req, res) => {
  const data = await changelogService.markSeen(req.user.id);
  res.status(200).json(successResponse('Changelog marked seen', data));
});

// ── Admin authoring ───────────────────────────────────────────────────────────

const listAll = catchAsync(async (req, res) => {
  const result = await changelogService.listForAdmin(req.query);
  res.status(200).json(successResponse('Updates retrieved', result));
});

const create = catchAsync(async (req, res) => {
  const update = await changelogService.create(req.user.id, req.body);
  res.status(201).json(successResponse('Update created', { update }));
});

const update = catchAsync(async (req, res) => {
  const result = await changelogService.update(req.params.id, req.body);
  res.status(200).json(successResponse('Update saved', { update: result }));
});

const remove = catchAsync(async (req, res) => {
  await changelogService.remove(req.params.id);
  res.status(200).json(successResponse('Update deleted'));
});

module.exports = { feed, markSeen, listAll, create, update, remove };

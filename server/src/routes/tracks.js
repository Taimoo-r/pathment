const express = require('express');
const router = express.Router();
const c = require('../controllers/trackController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission, scope } = require('../middlewares/authz');
const { PERMISSIONS } = require('../config/permissions');

// Tracks are a mentor's organizational lanes for a mentee — gated on mentee.view
// at that mentee's scope (clan mentors + admins), so analysts/other mentees can't
// touch them. The resource is located via the mentee, the track id, or the task id.
const byMentee = [authenticate, requirePermission(PERMISSIONS.MENTEE_VIEW, scope.mentee('menteeId'))];
const byTrack = [authenticate, requirePermission(PERMISSIONS.MENTEE_VIEW, scope.track('id'))];
const byTask = [authenticate, requirePermission(PERMISSIONS.MENTEE_VIEW, scope.task('taskId'))];

// Per-mentee lanes (mentor-curated).
router.get('/mentee/:menteeId', byMentee, c.listForMentee);
router.post('/mentee/:menteeId', byMentee, c.create);
router.patch('/mentee/:menteeId/reorder', byMentee, c.reorder);

router.patch('/:id', byTrack, c.rename);
router.patch('/:id/archive', byTrack, c.setArchived);
router.delete('/:id', byTrack, c.remove);
router.post('/:id/tasks', byTrack, c.addTask);

// Move an existing task into / out of a track.
router.patch('/task/:taskId', byTask, c.setTaskTrack);

module.exports = router;

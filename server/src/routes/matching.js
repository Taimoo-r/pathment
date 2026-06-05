const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const { authenticate, authorize } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authz');
const { PERMISSIONS } = require('../config/permissions');

router.post('/', authenticate, requirePermission(PERMISSIONS.MENTEE_MANAGE), matchingController.createMatch);
router.post('/auto-match', authenticate, requirePermission(PERMISSIONS.MENTEE_MANAGE), matchingController.autoMatchPending);
router.get('/suggestions/:enrollmentId', authenticate, requirePermission(PERMISSIONS.MENTEE_MANAGE), matchingController.getAISuggestions);
router.get('/mentor-levels', authenticate, matchingController.getMentorAssignedLevels);
router.get('/', authenticate, matchingController.getMatches);
router.patch('/:id/status', authenticate, matchingController.updateMatchStatus);
router.patch('/:id/rate', authenticate, authorize(['mentee', 'mentor', 'admin']), matchingController.submitRating);

module.exports = router;

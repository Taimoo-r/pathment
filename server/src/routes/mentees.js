const express = require('express');
const router = express.Router();
const menteeController = require('../controllers/menteeController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authz');
const { PERMISSIONS } = require('../config/permissions');

// Get all mentees with profile stats
router.get('/', authenticate, requirePermission(PERMISSIONS.MENTEE_VIEW), menteeController.getAllMentees);

// Get a single mentee's full profile
router.get('/:id', authenticate, requirePermission(PERMISSIONS.MENTEE_VIEW), menteeController.getMenteeById);

module.exports = router;

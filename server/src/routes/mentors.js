const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authz');
const { PERMISSIONS } = require('../config/permissions');

// Get all active mentors
router.get('/', authenticate, requirePermission(PERMISSIONS.USER_MANAGE), mentorController.getAllMentors);

// Get a single mentor's full profile
router.get('/:id', authenticate, requirePermission(PERMISSIONS.USER_MANAGE), mentorController.getMentorById);

module.exports = router;

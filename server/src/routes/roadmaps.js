const express = require('express');
const router = express.Router();
const roadmapController = require('../controllers/roadmapController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const roadmapValidation = require('../validations/roadmapValidation');

/**
 * @route   POST /api/programs/:programId/levels/:levelId/roadmap/generate
 * @desc    Generate AI roadmap for a level
 * @access  Admin, Creator
 */
router.post(
  '/:programId/levels/:levelId/roadmap/generate',
  authenticate,
  authorize('admin', 'mentor'),
  validate(roadmapValidation.generateRoadmap),
  roadmapController.generateRoadmap
);

/**
 * @route   POST /api/programs/:programId/levels/:levelId/roadmap
 * @desc    Create manual roadmap for a level
 * @access  Admin, Creator
 */
router.post(
  '/:programId/levels/:levelId/roadmap',
  authenticate,
  authorize('admin', 'mentor'),
  validate(roadmapValidation.createRoadmap),
  roadmapController.createRoadmap
);

/**
 * @route   GET /api/programs/:programId/levels/:levelId/roadmap
 * @desc    Get roadmap for a level
 * @access  Public (for published programs)
 */
router.get(
  '/:programId/levels/:levelId/roadmap',
  roadmapController.getLevelRoadmap
);

/**
 * @route   GET /api/roadmaps/:id
 * @desc    Get roadmap by ID
 * @access  Public (for published programs)
 */
router.get(
  '/roadmaps/:id',
  roadmapController.getRoadmapById
);

/**
 * @route   PUT /api/roadmaps/:id
 * @desc    Update roadmap
 * @access  Admin, Creator
 */
router.put(
  '/roadmaps/:id',
  authenticate,
  authorize('admin', 'mentor'),
  validate(roadmapValidation.updateRoadmap),
  roadmapController.updateRoadmap
);

/**
 * @route   DELETE /api/roadmaps/:id
 * @desc    Delete roadmap
 * @access  Admin, Creator
 */
router.delete(
  '/roadmaps/:id',
  authenticate,
  authorize('admin', 'mentor'),
  roadmapController.deleteRoadmap
);

/**
 * @route   POST /api/roadmaps/:roadmapId/weeks
 * @desc    Add week to roadmap
 * @access  Admin, Creator
 */
router.post(
  '/roadmaps/:roadmapId/weeks',
  authenticate,
  authorize('admin', 'mentor'),
  validate(roadmapValidation.addWeek),
  roadmapController.addWeek
);

/**
 * @route   PUT /api/weeks/:id
 * @desc    Update week
 * @access  Admin, Creator
 */
router.put(
  '/weeks/:id',
  authenticate,
  authorize('admin', 'mentor'),
  validate(roadmapValidation.updateWeek),
  roadmapController.updateWeek
);

/**
 * @route   DELETE /api/weeks/:id
 * @desc    Delete week
 * @access  Admin, Creator
 */
router.delete(
  '/weeks/:id',
  authenticate,
  authorize('admin', 'mentor'),
  roadmapController.deleteWeek
);

/**
 * @route   POST /api/weeks/:weekId/tasks
 * @desc    Add task to week
 * @access  Admin, Creator
 */
router.post(
  '/weeks/:weekId/tasks',
  authenticate,
  authorize('admin', 'mentor'),
  validate(roadmapValidation.addTask),
  roadmapController.addTask
);

/**
 * @route   PUT /api/roadmap-tasks/:id
 * @desc    Update task
 * @access  Admin, Creator
 */
router.put(
  '/roadmap-tasks/:id',
  authenticate,
  authorize('admin', 'mentor'),
  validate(roadmapValidation.updateTask),
  roadmapController.updateTask
);

/**
 * @route   DELETE /api/roadmap-tasks/:id
 * @desc    Delete task
 * @access  Admin, Creator
 */
router.delete(
  '/roadmap-tasks/:id',
  authenticate,
  authorize('admin', 'mentor'),
  roadmapController.deleteTask
);

module.exports = router;

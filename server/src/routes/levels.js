const express = require('express');
const router = express.Router();
const levelController = require('../controllers/levelController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const levelValidation = require('../validations/levelValidation');

/**
 * @route   POST /api/programs/:programId/levels
 * @desc    Create a new level for a program
 * @access  Admin, Mentor (Creator)
 */
router.post(
  '/:programId/levels',
  authenticate,
  authorize('admin', 'mentor'),
  validate(levelValidation.createLevel),
  levelController.createLevel
);

/**
 * @route   GET /api/programs/:programId/levels
 * @desc    Get all levels for a program
 * @access  Public (for published programs)
 */
router.get(
  '/:programId/levels',
  levelController.getProgramLevels
);

/**
 * @route   PUT /api/programs/:programId/levels/reorder
 * @desc    Reorder levels
 * @access  Admin, Creator
 */
router.put(
  '/:programId/levels/reorder',
  authenticate,
  authorize('admin', 'mentor'),
  validate(levelValidation.reorderLevels),
  levelController.reorderLevels
);

/**
 * @route   GET /api/levels/:id
 * @desc    Get a single level by ID
 * @access  Public (for published programs)
 */
router.get(
  '/levels/:id',
  levelController.getLevelById
);

/**
 * @route   PUT /api/levels/:id
 * @desc    Update a level
 * @access  Admin, Creator
 */
router.put(
  '/levels/:id',
  authenticate,
  authorize('admin', 'mentor'),
  validate(levelValidation.updateLevel),
  levelController.updateLevel
);

/**
 * @route   DELETE /api/levels/:id
 * @desc    Delete a level
 * @access  Admin, Creator
 */
router.delete(
  '/levels/:id',
  authenticate,
  authorize('admin', 'mentor'),
  levelController.deleteLevel
);

module.exports = router;

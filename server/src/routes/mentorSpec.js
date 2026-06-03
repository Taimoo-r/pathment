const express = require('express');
const router = express.Router();
const { catchAsync } = require('../middlewares/errorHandler');
const { successResponse } = require('../utils/responses');
const { authenticate, authorize } = require('../middlewares/auth');
const mentorSpecService = require('../services/mentorSpecService');

// Read the org mentor handbook (any authenticated user).
router.get('/', authenticate, catchAsync(async (req, res) => {
  const spec = await mentorSpecService.get();
  res.status(200).json(successResponse('Mentor spec retrieved', { spec }));
}));

// Author/update the handbook (admin only).
router.put('/', authenticate, authorize(['admin']), catchAsync(async (req, res) => {
  const spec = await mentorSpecService.save(req.body.spec || req.body, req.user.id);
  res.status(200).json(successResponse('Mentor spec saved', { spec }));
}));

module.exports = router;

const levelService = require('../services/levelService');
const { successResponse } = require('../utils/responses');
const { catchAsync } = require('../middlewares/errorHandler');

exports.createLevel = catchAsync(async (req, res) => {
  const { programId } = req.params;
  const level = await levelService.createLevel(programId, req.body, req.user.id, req.user.role);
  res.status(201).json(successResponse('Level created successfully', { level }, 201));
});

exports.getProgramLevels = catchAsync(async (req, res) => {
  const { programId } = req.params;
  const levels = await levelService.getProgramLevels(programId);
  res.status(200).json(successResponse('Levels retrieved successfully', { levels }));
});

exports.getLevelById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const level = await levelService.getLevelById(id);
  res.status(200).json(successResponse('Level retrieved successfully', { level }));
});

exports.updateLevel = catchAsync(async (req, res) => {
  const { id } = req.params;
  const level = await levelService.updateLevel(id, req.body, req.user.id, req.user.role);
  res.status(200).json(successResponse('Level updated successfully', { level }));
});

exports.deleteLevel = catchAsync(async (req, res) => {
  const { id } = req.params;
  await levelService.deleteLevel(id, req.user.id, req.user.role);
  res.status(200).json(successResponse('Level deleted successfully'));
});

exports.reorderLevels = catchAsync(async (req, res) => {
  const { programId } = req.params;
  const { levelIds } = req.body;
  const levels = await levelService.reorderLevels(programId, levelIds, req.user.id, req.user.role);
  res.status(200).json(successResponse('Levels reordered successfully', { levels }));
});

const roadmapService = require('../services/roadmapService');
const { successResponse } = require('../utils/responses');
const { catchAsync } = require('../middlewares/errorHandler');
const { ValidationError } = require('../utils/errors/errorTypes');

exports.generateRoadmap = catchAsync(async (req, res) => {
  const { programId, levelId } = req.params;
  const { additionalInstructions } = req.body;
  
  // Validate IDs
  if (!levelId || levelId === 'undefined' || levelId === 'null') {
    throw new ValidationError('Valid level ID is required');
  }
  
  if (!programId || programId === 'undefined' || programId === 'null') {
    throw new ValidationError('Valid program ID is required');
  }
  
  const roadmap = await roadmapService.generateRoadmap(programId, levelId, req.user.id, additionalInstructions);
  res.status(201).json(successResponse('Roadmap generated successfully', { roadmap }, 201));
});

exports.createRoadmap = catchAsync(async (req, res) => {
  const { programId, levelId } = req.params;
  const roadmap = await roadmapService.createRoadmap(programId, levelId, req.body, req.user.id);
  res.status(201).json(successResponse('Roadmap created successfully', { roadmap }, 201));
});

exports.getRoadmapById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const roadmap = await roadmapService.getRoadmapById(id);
  res.status(200).json(successResponse('Roadmap retrieved successfully', { roadmap }));
});

exports.getLevelRoadmap = catchAsync(async (req, res) => {
  const { programId, levelId } = req.params;
  const roadmap = await roadmapService.getLevelRoadmap(programId, levelId);
  res.status(200).json(successResponse('Roadmap retrieved successfully', { roadmap }));
});

exports.updateRoadmap = catchAsync(async (req, res) => {
  const { id } = req.params;
  const roadmap = await roadmapService.updateRoadmap(id, req.body, req.user.id, req.user.role);
  res.status(200).json(successResponse('Roadmap updated successfully', { roadmap }));
});

exports.deleteRoadmap = catchAsync(async (req, res) => {
  const { id } = req.params;
  await roadmapService.deleteRoadmap(id, req.user.id, req.user.role);
  res.status(200).json(successResponse('Roadmap deleted successfully'));
});

exports.addWeek = catchAsync(async (req, res) => {
  const { roadmapId } = req.params;
  const week = await roadmapService.addWeek(roadmapId, req.body, req.user.id, req.user.role);
  res.status(201).json(successResponse('Week added successfully', { week }, 201));
});

exports.updateWeek = catchAsync(async (req, res) => {
  const { id } = req.params;
  const week = await roadmapService.updateWeek(id, req.body, req.user.id, req.user.role);
  res.status(200).json(successResponse('Week updated successfully', { week }));
});

exports.deleteWeek = catchAsync(async (req, res) => {
  const { id } = req.params;
  await roadmapService.deleteWeek(id, req.user.id, req.user.role);
  res.status(200).json(successResponse('Week deleted successfully'));
});

exports.addTask = catchAsync(async (req, res) => {
  const { weekId } = req.params;
  const task = await roadmapService.addTask(weekId, req.body, req.user.id, req.user.role);
  res.status(201).json(successResponse('Task added successfully', { task }, 201));
});

exports.updateTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const task = await roadmapService.updateTask(id, req.body, req.user.id, req.user.role);
  res.status(200).json(successResponse('Task updated successfully', { task }));
});

exports.deleteTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  await roadmapService.deleteTask(id, req.user.id, req.user.role);
  res.status(200).json(successResponse('Task deleted successfully'));
});

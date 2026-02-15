const { models } = require('../db');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors/errorTypes');
const { Op } = require('sequelize');

class TaskService {
  /**
   * Auto-assign roadmap tasks for a mentee's current week
   * Called when mentee advances to a new week
   */
  async autoAssignWeekTasks(enrollmentId, weekNumber) {
    const enrollment = await models.Enrollment.findByPk(enrollmentId, {
      include: [
        { model: models.Program, as: 'program' },
        { model: models.ProgramLevel, as: 'currentLevel' },
        { model: models.User, as: 'mentee' }
      ]
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    // Get the mentee's mentor
    const match = await models.MentorMenteeMatch.findOne({
      where: {
        enrollmentId,
        status: 'active'
      }
    });

    if (!match) {
      throw new ValidationError('No active mentor assigned');
    }

    // Get roadmap for this level
    const roadmap = await models.Roadmap.findOne({
      where: {
        programId: enrollment.programId,
        levelId: enrollment.currentLevelId,
        isBaseRoadmap: true
      }
    });

    if (!roadmap) {
      throw new NotFoundError('Roadmap not found for this level');
    }

    // Get the week from roadmap
    const week = await models.RoadmapWeek.findOne({
      where: {
        roadmapId: roadmap.id,
        weekNumber
      },
      include: [
        {
          model: models.RoadmapTask,
          as: 'tasks',
          order: [['taskOrder', 'ASC']]
        }
      ]
    });

    if (!week) {
      return { assignedTasks: [] }; // No tasks for this week
    }

    const assignedTasks = [];
    
    for (const task of week.tasks) {
      // Check if task is already assigned
      const existing = await models.AssignedTask.findOne({
        where: {
          roadmapTaskId: task.id,
          menteeId: enrollment.menteeId,
          enrollmentId
        }
      });

      if (!existing) {
        // Calculate due date (1 week from now for weekly tasks)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const assignedTask = await models.AssignedTask.create({
          roadmapTaskId: task.id,
          menteeId: enrollment.menteeId,
          mentorId: match.mentorId,
          enrollmentId,
          status: 'assigned',
          dueDate,
          isCustomTask: false
        });

        assignedTasks.push(await this.getAssignedTaskById(assignedTask.id));
      }
    }

    // Update enrollment task stats
    await this.updateEnrollmentTaskStats(enrollmentId);

    return { assignedTasks, week: week.title };
  }

  /**
   * Create custom task (mentor creates for specific mentee)
   */
  async createCustomTask(data, mentorId) {
    const {
      menteeId,
      enrollmentId,
      roadmapTaskId, // NEW: If provided, assign existing roadmap task
      title,
      description,
      type,
      difficulty,
      dueDate,
      pointsBase,
      deliverable,
      acceptanceCriteria
    } = data;

    // Verify mentor-mentee relationship
    const match = await models.MentorMenteeMatch.findOne({
      where: {
        mentorId,
        menteeId,
        enrollmentId,
        status: 'active'
      }
    });

    if (!match) {
      throw new ForbiddenError('You are not the mentor for this mentee');
    }

    let roadmapTask;

    // If roadmapTaskId provided, use existing roadmap task
    if (roadmapTaskId) {
      roadmapTask = await models.RoadmapTask.findByPk(roadmapTaskId);
      if (!roadmapTask) {
        throw new NotFoundError('Roadmap task not found');
      }
    } else {
      // Create custom roadmap task
      roadmapTask = await models.RoadmapTask.create({
        roadmapWeekId: null, // Custom tasks don't belong to a week
        title,
        description,
        type: type || 'custom',
        difficulty: difficulty || 'medium',
        taskOrder: 0,
        deliverable: deliverable || 'Complete the assigned task',
        acceptanceCriteria: acceptanceCriteria || [],
        estimatedHours: 5,
        isMandatory: false,
        isCustomTask: true,
        pointsBase: pointsBase || 10
      });
    }

    // Create assigned task
    const assignedTask = await models.AssignedTask.create({
      roadmapTaskId: roadmapTask.id,
      menteeId,
      mentorId,
      enrollmentId,
      status: 'assigned',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isCustomTask: roadmapTaskId ? false : true // Roadmap tasks are not custom
    });

    await this.updateEnrollmentTaskStats(enrollmentId);

    return this.getAssignedTaskById(assignedTask.id);
  }

  /**
   * Get tasks for a mentee
   */
  async getMenteeTasks(menteeId, filters = {}) {
    const where = { menteeId };
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.enrollmentId) {
      where.enrollmentId = filters.enrollmentId;
    }

    if (filters.isCustomTask !== undefined) {
      where.isCustomTask = filters.isCustomTask;
    }

    return models.AssignedTask.findAll({
      where,
      include: [
        {
          model: models.RoadmapTask,
          as: 'roadmapTask',
          include: [
            {
              model: models.RoadmapWeek,
              as: 'week'
            }
          ]
        },
        {
          model: models.User,
          as: 'mentor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: models.Enrollment,
          as: 'enrollment',
          include: [
            { model: models.Program, as: 'program' },
            { model: models.ProgramLevel, as: 'currentLevel' }
          ]
        },
        {
          model: models.TaskSubmission,
          as: 'submissions',
          separate: true,
          order: [['version', 'DESC']],
          limit: 1
        }
      ],
      order: [
        ['dueDate', 'ASC'],
        ['assignedAt', 'DESC']
      ]
    });
  }

  /**
   * Get tasks for a mentor (to review)
   */
  async getMentorTasks(mentorId, filters = {}) {
    const where = { mentorId };
    
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.enrollmentId) {
      where.enrollmentId = filters.enrollmentId;
    }

    if (filters.menteeId) {
      where.menteeId = filters.menteeId;
    }

    // For pending review, get submitted tasks
    if (filters.pendingReview) {
      where.status = 'submitted';
    }

    return models.AssignedTask.findAll({
      where,
      include: [
        {
          model: models.RoadmapTask,
          as: 'roadmapTask',
          include: [
            {
              model: models.RoadmapWeek,
              as: 'week'
            }
          ]
        },
        {
          model: models.User,
          as: 'mentee',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: models.Enrollment,
          as: 'enrollment',
          include: [
            { model: models.Program, as: 'program' },
            { model: models.ProgramLevel, as: 'currentLevel' }
          ]
        },
        {
          model: models.TaskSubmission,
          as: 'submissions',
          separate: true,
          order: [['version', 'DESC']],
          limit: 1,
          include: [
            {
              model: models.TaskFeedback,
              as: 'feedback'
            }
          ]
        }
      ],
      order: [
        ['submittedAt', 'DESC'],
        ['dueDate', 'ASC']
      ]
    });
  }

  /**
   * Get single assigned task by ID
   */
  async getAssignedTaskById(taskId) {
    const task = await models.AssignedTask.findByPk(taskId, {
      include: [
        {
          model: models.RoadmapTask,
          as: 'roadmapTask',
          include: [
            {
              model: models.RoadmapWeek,
              as: 'week'
            },
            {
              model: models.TaskResource,
              as: 'resources'
            }
          ]
        },
        {
          model: models.User,
          as: 'mentee',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: models.User,
          as: 'mentor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: models.Enrollment,
          as: 'enrollment',
          include: [
            { model: models.Program, as: 'program' },
            { model: models.ProgramLevel, as: 'currentLevel' }
          ]
        },
        {
          model: models.TaskSubmission,
          as: 'submissions',
          separate: true,
          order: [['version', 'DESC']],
          include: [
            {
              model: models.TaskFeedback,
              as: 'feedback',
              include: [
                {
                  model: models.User,
                  as: 'mentor',
                  attributes: ['id', 'firstName', 'lastName']
                }
              ]
            },
            {
              model: models.TaskSubmissionFile,
              as: 'files'
            }
          ]
        }
      ]
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return task;
  }

  /**
   * Submit task
   */
  async submitTask(taskId, menteeId, submissionData) {
    const task = await models.AssignedTask.findByPk(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.menteeId !== menteeId) {
      throw new ForbiddenError('This task is not assigned to you');
    }

    if (task.status === 'completed') {
      throw new ValidationError('Task is already completed');
    }

    // Create submission
    const version = task.currentSubmissionVersion + 1;
    const submission = await models.TaskSubmission.create({
      assignedTaskId: taskId,
      version,
      submissionText: submissionData.submissionText,
      submissionUrls: submissionData.submissionUrls || []
    });

    // Update task status
    await task.update({
      status: 'submitted',
      submittedAt: new Date(),
      currentSubmissionVersion: version,
      startedAt: task.startedAt || new Date(),
      isLate: task.dueDate && new Date() > new Date(task.dueDate)
    });

    return this.getAssignedTaskById(taskId);
  }

  /**
   * Review task submission
   */
  async reviewTask(taskId, mentorId, reviewData) {
    const task = await models.AssignedTask.findByPk(taskId, {
      include: [
        {
          model: models.TaskSubmission,
          as: 'submissions',
          order: [['version', 'DESC']],
          limit: 1
        }
      ]
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.mentorId !== mentorId) {
      throw new ForbiddenError('You are not the mentor for this task');
    }

    if (task.status !== 'submitted') {
      throw new ValidationError('Task is not in submitted state');
    }

    const latestSubmission = task.submissions[0];
    if (!latestSubmission) {
      throw new ValidationError('No submission found');
    }

    const { rating, feedback, status, pointsAwarded } = reviewData;

    // Create feedback
    await models.TaskFeedback.create({
      assignedTaskId: taskId,
      submissionId: latestSubmission.id,
      reviewerId: mentorId,
      rating: rating || 0,
      comments: feedback,
      feedbackType: status === 'completed' ? 'approval' : 'revision',
      isPositive: status === 'completed'
    });

    // Update submission
    await latestSubmission.update({
      reviewedAt: new Date()
    });

    // Update task
    const updateData = {
      status,
      finalRating: rating
    };

    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.pointsAwarded = pointsAwarded || task.roadmapTask?.pointsBase || 10;
    } else if (status === 'revision_needed') {
      updateData.revisionCount = task.revisionCount + 1;
    }

    await task.update(updateData);

    // Update enrollment stats
    await this.updateEnrollmentTaskStats(task.enrollmentId);

    return this.getAssignedTaskById(taskId);
  }

  /**
   * Update task status (start, cancel, etc.)
   */
  async updateTaskStatus(taskId, userId, userRole, status) {
    const task = await models.AssignedTask.findByPk(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check permissions
    if (userRole !== 'admin') {
      if (userRole === 'mentee' && task.menteeId !== userId) {
        throw new ForbiddenError('Not authorized');
      }
      if (userRole === 'mentor' && task.mentorId !== userId) {
        throw new ForbiddenError('Not authorized');
      }
    }

    const validStatuses = ['not_started', 'assigned', 'in_progress', 'submitted', 'revision_needed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const updateData = { status };

    if (status === 'in_progress' && !task.startedAt) {
      updateData.startedAt = new Date();
    }

    await task.update(updateData);

    return this.getAssignedTaskById(taskId);
  }

  /**
   * Update enrollment task statistics
   */
  async updateEnrollmentTaskStats(enrollmentId) {
    const tasks = await models.AssignedTask.findAll({
      where: { enrollmentId },
      include: [
        {
          model: models.RoadmapTask,
          as: 'roadmapTask'
        }
      ]
    });

    const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
    const tasksTotal = tasks.length;
    const totalPointsEarned = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.pointsAwarded || 0), 0);

    const ratings = tasks
      .filter(t => t.finalRating !== null)
      .map(t => parseFloat(t.finalRating));
    
    const avgTaskRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : null;

    // Calculate progress percentage
    const overallProgressPercentage = tasksTotal > 0
      ? Math.round((tasksCompleted / tasksTotal) * 100)
      : 0;

    await models.Enrollment.update(
      {
        tasksCompleted,
        tasksTotal,
        totalPointsEarned,
        avgTaskRating,
        overallProgressPercentage
      },
      { where: { id: enrollmentId } }
    );

    return {
      tasksCompleted,
      tasksTotal,
      totalPointsEarned,
      avgTaskRating,
      overallProgressPercentage
    };
  }

  /**
   * Get task statistics for mentor dashboard
   */
  async getMentorTaskStats(mentorId) {
    const allTasks = await models.AssignedTask.findAll({
      where: { mentorId }
    });

    const pendingReview = allTasks.filter(t => t.status === 'submitted').length;
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const revisionNeeded = allTasks.filter(t => t.status === 'revision_needed').length;
    const active = allTasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length;

    // Get tasks reviewed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reviewedToday = allTasks.filter(t => 
      t.completedAt && new Date(t.completedAt) >= today
    ).length;

    return {
      total: allTasks.length,
      pendingReview,
      reviewedToday,
      completed,
      revisionNeeded,
      active
    };
  }

  /**
   * Get task statistics for mentee dashboard
   */
  async getMenteeTaskStats(menteeId, enrollmentId) {
    const where = { menteeId };
    if (enrollmentId) {
      where.enrollmentId = enrollmentId;
    }

    const allTasks = await models.AssignedTask.findAll({ where });

    const completed = allTasks.filter(t => t.status === 'completed').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const pending = allTasks.filter(t => t.status === 'assigned').length;
    const submitted = allTasks.filter(t => t.status === 'submitted').length;
    const revisionNeeded = allTasks.filter(t => t.status === 'revision_needed').length;

    // Count overdue tasks
    const now = new Date();
    const overdue = allTasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      !['completed', 'cancelled'].includes(t.status)
    ).length;

    return {
      total: allTasks.length,
      completed,
      inProgress,
      pending,
      submitted,
      revisionNeeded,
      overdue
    };
  }

  /**
   * Delete custom task (mentor only)
   */
  async deleteCustomTask(taskId, mentorId) {
    const task = await models.AssignedTask.findByPk(taskId, {
      include: [{ model: models.RoadmapTask, as: 'roadmapTask' }]
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (!task.isCustomTask) {
      throw new ValidationError('Only custom tasks can be deleted');
    }

    if (task.mentorId !== mentorId) {
      throw new ForbiddenError('You can only delete your own custom tasks');
    }

    if (task.status === 'completed' || task.status === 'submitted') {
      throw new ValidationError('Cannot delete submitted or completed tasks');
    }

    const enrollmentId = task.enrollmentId;
    const roadmapTaskId = task.roadmapTaskId;

    // Delete assigned task
    await task.destroy();

    // Delete the custom roadmap task if no other assignments exist
    const otherAssignments = await models.AssignedTask.count({
      where: { roadmapTaskId }
    });

    if (otherAssignments === 0) {
      await models.RoadmapTask.destroy({ where: { id: roadmapTaskId } });
    }

    // Update enrollment stats
    await this.updateEnrollmentTaskStats(enrollmentId);

    return { message: 'Custom task deleted successfully' };
  }

  /**
   * Cancel a task (admin/mentor only)
   * Marks task as cancelled and records who cancelled it
   */
  async cancelTask(taskId, userId, userRole, reason = null) {
    const task = await models.AssignedTask.findByPk(taskId, {
      include: [
        { model: models.RoadmapTask, as: 'roadmapTask' },
        { 
          model: models.Enrollment, 
          as: 'enrollment',
          include: [
            { model: models.User, as: 'mentee' },
            {
              model: models.MentorMenteeMatch,
              as: 'currentMatch',
              where: { status: 'active' },
              required: false
            }
          ]
        }
      ]
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Authorization: Admin can cancel any task, mentor can only cancel their mentee's tasks
    if (userRole === 'mentor') {
      const match = task.enrollment.currentMatch;
      if (!match || match.mentorId !== userId) {
        throw new ForbiddenError('You can only cancel tasks for your own mentees');
      }
    } else if (userRole !== 'admin') {
      throw new ForbiddenError('Only admins and mentors can cancel tasks');
    }

    // Cannot cancel already completed tasks
    if (task.status === 'completed') {
      throw new ValidationError('Cannot cancel completed tasks');
    }

    // Update task status to cancelled
    task.status = 'cancelled';
    task.cancelledBy = userId;
    task.cancelledAt = new Date();
    task.cancellationReason = reason;
    await task.save();

    // Update enrollment stats
    await this.updateEnrollmentTaskStats(task.enrollmentId);

    return task;
  }

  /**
   * Get roadmap tasks for a program level (for mentors to view and assign)
   * If menteeId is provided, include assignment status for that mentee
   */
  async getRoadmapTasks(programId, levelId, menteeId = null) {
    // Get the roadmap for this program/level
    const roadmap = await models.Roadmap.findOne({
      where: {
        programId,
        levelId,
        isBaseRoadmap: true
      },
      include: [
        {
          model: models.RoadmapWeek,
          as: 'weeks',
          include: [
            {
              model: models.RoadmapTask,
              as: 'tasks',
              where: { isCustomTask: false },
              required: false
            }
          ]
        }
      ],
      order: [[{ model: models.RoadmapWeek, as: 'weeks' }, 'weekNumber', 'ASC']]
    });

    if (!roadmap) {
      throw new NotFoundError('Roadmap not found for this program level');
    }

    // If menteeId is provided, check which tasks are already assigned to this mentee
    if (menteeId && roadmap.weeks) {
      for (const week of roadmap.weeks) {
        if (week.tasks) {
          for (const task of week.tasks) {
            // Check if this roadmap task is assigned to the mentee
            const assignedTask = await models.AssignedTask.findOne({
              where: {
                menteeId,
                roadmapTaskId: task.id
              },
              attributes: ['id', 'status', 'submittedAt', 'completedAt']
            });

            // Add assignment status to the task object
            task.dataValues.assignmentStatus = assignedTask ? {
              isAssigned: true,
              taskId: assignedTask.id,
              status: assignedTask.status,
              submittedAt: assignedTask.submittedAt,
              completedAt: assignedTask.completedAt
            } : {
              isAssigned: false
            };
          }
        }
      }
    }

    return roadmap;
  }
}

module.exports = new TaskService();

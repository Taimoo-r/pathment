const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate, authorize } = require('../middlewares/auth');
const { requirePermission, scope } = require('../middlewares/authz');
const { PERMISSIONS } = require('../config/permissions');

router.get('/stats', authenticate, requirePermission(PERMISSIONS.ANALYTICS_VIEW), enrollmentController.getEnrollmentStats);
router.get('/', authenticate, authorize(['admin', 'mentor', 'mentee']), enrollmentController.getEnrollments);
router.get('/:id', authenticate, enrollmentController.getEnrollmentById);
// Enrollment is invite-driven (placement on the invite) or admin-initiated.
// Mentees can no longer self-enroll - there is no mentee browse/request path.
router.post('/', authenticate, requirePermission(PERMISSIONS.MENTEE_MANAGE), enrollmentController.createEnrollment);
router.patch('/:id/status', authenticate, enrollmentController.updateEnrollmentStatus);
router.post('/:id/approve', authenticate, requirePermission(PERMISSIONS.MENTEE_MANAGE), enrollmentController.approveEnrollment);
router.post('/:id/reject', authenticate, requirePermission(PERMISSIONS.MENTEE_MANAGE), enrollmentController.rejectEnrollment);

// ─── Level completion & progression ──────────────────────────────────────────
// Mentee or Mentor: request completion of current level
router.post('/:id/request-completion', authenticate, authorize(['mentee', 'mentor']), enrollmentController.requestCompletion);
// Sign-off on completion needs task.review AT the enrollment's clan/program —
// any clan mentor (lead or co) + program/super admins; blocks mentees & analysts.
router.post('/:id/approve-completion', authenticate, requirePermission(PERMISSIONS.TASK_REVIEW, scope.enrollment('id')), enrollmentController.approveCompletion);
router.post('/:id/reject-completion',  authenticate, requirePermission(PERMISSIONS.TASK_REVIEW, scope.enrollment('id')), enrollmentController.rejectCompletion);
// Admin: remove (unenroll) a mentee from a program
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.MENTEE_MANAGE), enrollmentController.removeEnrollment);

module.exports = router;

const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticate, authorize } = require('../middlewares/auth');
const { requirePermission, scope } = require('../middlewares/authz');
const { PERMISSIONS } = require('../config/permissions');

// Anyone authenticated can read announcements (scoped to them) + react.
router.get('/', authenticate, announcementController.list);
router.post('/:id/react', authenticate, announcementController.react);

// Clans the logged-in mentor leads (compose dropdown) — own data.
router.get('/led-clans', authenticate, authorize(['mentor', 'admin']), announcementController.myLedClans);

// Composing needs announcement.post AT the target's scope: a clan mentor can
// announce to their clan, a program/super admin org-wide; a mentee cannot (a
// clan mentee holds community.post at clan scope, but not announcement.post).
router.post('/', authenticate, requirePermission(PERMISSIONS.ANNOUNCEMENT_POST, scope.announcementBody()), announcementController.create);
// Pin / remove — gated to someone who can announce in that scope; the service
// further restricts to the author or an admin.
router.patch('/:id/pin', authenticate, requirePermission(PERMISSIONS.ANNOUNCEMENT_POST, scope.announcement('id')), announcementController.togglePin);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.ANNOUNCEMENT_POST, scope.announcement('id')), announcementController.remove);

module.exports = router;

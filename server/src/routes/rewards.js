const express = require('express');
const router = express.Router();
const c = require('../controllers/rewardsController');
const { authenticate, authorize } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authz');
const { PERMISSIONS } = require('../config/permissions');
const upload = require('../middlewares/upload');

// Catalog + redemptions (mentor/admin).
router.get('/', authenticate, authorize(['mentor', 'admin']), c.overview);
router.post('/redeem', authenticate, authorize(['mentor', 'admin']), c.redeem);
router.get('/balance/:menteeId', authenticate, authorize(['mentor', 'admin']), c.menteeBalance);

// Catalog management (admin only).
router.post('/gifts/upload', authenticate, requirePermission(PERMISSIONS.GAMIFICATION_MANAGE), upload.single('file'), c.uploadGiftImage);
router.post('/gifts', authenticate, requirePermission(PERMISSIONS.GAMIFICATION_MANAGE), c.createGift);
router.patch('/gifts/:id', authenticate, requirePermission(PERMISSIONS.GAMIFICATION_MANAGE), c.updateGift);
router.delete('/gifts/:id', authenticate, requirePermission(PERMISSIONS.GAMIFICATION_MANAGE), c.removeGift);

module.exports = router;

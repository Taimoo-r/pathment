const express = require('express');
const router = express.Router();
const c = require('../controllers/rewardsController');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Catalog + redemptions (mentor/admin).
router.get('/', authenticate, authorize(['mentor', 'admin']), c.overview);
router.post('/redeem', authenticate, authorize(['mentor', 'admin']), c.redeem);
router.get('/balance/:menteeId', authenticate, authorize(['mentor', 'admin']), c.menteeBalance);

// Catalog management (admin only).
router.post('/gifts/upload', authenticate, authorize(['admin']), upload.single('file'), c.uploadGiftImage);
router.post('/gifts', authenticate, authorize(['admin']), c.createGift);
router.patch('/gifts/:id', authenticate, authorize(['admin']), c.updateGift);
router.delete('/gifts/:id', authenticate, authorize(['admin']), c.removeGift);

module.exports = router;

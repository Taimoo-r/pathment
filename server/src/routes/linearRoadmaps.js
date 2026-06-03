const express = require('express');
const router = express.Router();
const c = require('../controllers/linearRoadmapController');
const { authenticate, authorize } = require('../middlewares/auth');

const adminOnly = [authenticate, authorize(['admin'])];

// Mentee's own roadmap progress (step X/N) for their progress view.
router.get('/me', authenticate, c.myRoadmaps);

// Admin org-roadmap authoring (the shared library mentors import + assign).
router.get('/org', adminOnly, c.listOrg);
router.post('/org', adminOnly, c.createOrg);
router.patch('/org/:id', adminOnly, c.updateOrg);
router.post('/org/:id/steps', adminOnly, c.addOrgStep);
router.delete('/org/:id/steps/:stepId', adminOnly, c.removeOrgStep);
router.delete('/org/:id', adminOnly, c.deleteOrg);

module.exports = router;

const express = require('express');
const router = express.Router();
const c = require('../controllers/libraryController');
const { authenticate, authorize } = require('../middlewares/auth');

// Any authenticated user can read the library.
router.get('/', authenticate, c.list);
router.get('/:id', authenticate, c.getOne);

// Mentors/admins curate it.
router.post('/', authenticate, authorize(['mentor', 'admin']), c.create);
router.patch('/:id', authenticate, authorize(['mentor', 'admin']), c.update);
router.patch('/:id/pin', authenticate, authorize(['mentor', 'admin']), c.togglePin);
router.delete('/:id', authenticate, authorize(['mentor', 'admin']), c.remove);

module.exports = router;

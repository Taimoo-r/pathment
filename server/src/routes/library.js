const express = require('express');
const router = express.Router();
const c = require('../controllers/libraryController');
const { authenticate } = require('../middlewares/auth');
const { requirePermissionAnyScope } = require('../middlewares/authz');
const { PERMISSIONS } = require('../config/permissions');

// Any authenticated user can read the library.
router.get('/', authenticate, c.list);
router.get('/:id', authenticate, c.getOne);

// Curating the org-global library needs library.manage (held by mentors + program
// admins + super admin) — at any scope, since the library isn't clan-specific.
const canCurate = requirePermissionAnyScope(PERMISSIONS.LIBRARY_MANAGE);
router.post('/', authenticate, canCurate, c.create);
router.patch('/:id', authenticate, canCurate, c.update);
router.patch('/:id/pin', authenticate, canCurate, c.togglePin);
router.delete('/:id', authenticate, canCurate, c.remove);

module.exports = router;

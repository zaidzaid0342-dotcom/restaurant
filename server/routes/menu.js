const express = require('express');
const router = express.Router();
const { list, create, update, remove } = require('../controllers/menuController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// All routes require authentication and admin privileges
router.get('/', list);
router.post('/', auth, admin, create);
router.put('/:id', auth, admin, update);
router.delete('/:id', auth, admin, remove);

module.exports = router;
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/auth/register (Admin only)
router.post('/register', authenticate, authorize('admin'), register);

// POST /api/auth/login (Public)
router.post('/login', login);

module.exports = router;

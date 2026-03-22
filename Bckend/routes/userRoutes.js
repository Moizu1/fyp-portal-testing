const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getSupervisors,
  getStudents
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/users/supervisors - Get all supervisors (for students creating groups)
router.get('/supervisors', authenticate, getSupervisors);

// GET /api/users/students - Get all students (for adding group members)
router.get('/students', authenticate, getStudents);

// GET /api/users - Get all users (protected, admin and coordinator)
router.get('/', authenticate, authorize('admin', 'coordinator'), getAllUsers);

// GET /api/users/:id - Get user by ID (protected)
router.get('/:id', authenticate, getUserById);

// POST /api/users - Create user (protected, admin only)
router.post('/', authenticate, authorize('admin'), createUser);

// PUT /api/users/:id - Update user (protected, admin only)
router.put('/:id', authenticate, authorize('admin'), updateUser);

// DELETE /api/users/:id - Delete user (protected, admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;

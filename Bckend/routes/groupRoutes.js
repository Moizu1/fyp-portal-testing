const express = require('express');
const router = express.Router();
const {
  createGroup,
  addMember,
  supervisorReview,
  submitToCoordinator,
  coordinatorReview,
  getAllGroups,
  getGroupById,
  getGroupsBySupervisor,
  getGroupByStudent,
  updateGroupStatus,
  updateGroup,
  getAssignedUsers,
  assignExaminers
} = require('../controllers/groupController');
const { authenticate, authorize } = require('../middleware/auth');

// Create group (Students only)
router.post('/create', authenticate, authorize('student'), createGroup);

// Add member to group (Students only)
router.post('/add-member', authenticate, authorize('student'), addMember);

// Supervisor reviews group
router.put('/:groupId/supervisor-review', authenticate, authorize('supervisor'), supervisorReview);

// Submit to coordinator (Students)
router.put('/:groupId/submit-to-coordinator', authenticate, authorize('student'), submitToCoordinator);

// Update group (Students - after rejection)
router.put('/:groupId/update', authenticate, authorize('student'), updateGroup);

// Coordinator reviews group
router.put('/:groupId/coordinator-review', authenticate, authorize('coordinator'), coordinatorReview);

// Get all groups (Admin, Coordinator)
router.get('/', authenticate, authorize('admin', 'coordinator'), getAllGroups);

// Get assigned users (for filtering available supervisors/students)
router.get('/assigned-users', authenticate, getAssignedUsers);

// Get groups by supervisor (must be before /:groupId)
router.get('/supervisor/my-groups', authenticate, authorize('supervisor'), getGroupsBySupervisor);

// Get group by student (must be before /:groupId)
router.get('/student/my-group', authenticate, authorize('student'), getGroupByStudent);

// Get group by ID (must be after specific routes)
router.get('/:groupId', authenticate, getGroupById);

// Update group status (Coordinator only)
router.put('/:groupId/status', authenticate, authorize('coordinator'), updateGroupStatus);

// Assign examiners to group (Coordinator only)
router.put('/:groupId/assign-examiners', authenticate, authorize('coordinator'), assignExaminers);

module.exports = router;

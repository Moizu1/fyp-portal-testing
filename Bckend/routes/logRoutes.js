const express = require('express');
const router = express.Router();
const {
  submitLog,
  approveLog,
  getLogsByGroup,
  getLogsByStudent,
  getLogsForSupervisor,
  getAllLogs,
  updateLog,
  deleteLog,
  getApprovedLogsByGroup
} = require('../controllers/logController');
const { authenticate, authorize } = require('../middleware/auth');

// Submit log (Students only)
router.post('/submit', authenticate, authorize('student'), submitLog);

// Approve log (Supervisor only)
router.put('/:logId/approve', authenticate, authorize('supervisor'), approveLog);

// Get logs by group
router.get('/group/:groupId', authenticate, getLogsByGroup);

// Get approved logs by group (Coordinator)
router.get('/group/:groupId/approved', authenticate, authorize('coordinator', 'admin'), getApprovedLogsByGroup);

// Get logs by student
router.get('/student/my-logs', authenticate, authorize('student'), getLogsByStudent);

// Get logs for supervisor
router.get('/supervisor/my-logs', authenticate, authorize('supervisor'), getLogsForSupervisor);

// Get all logs (Admin, Coordinator)
router.get('/', authenticate, authorize('admin', 'coordinator'), getAllLogs);

// Update log (Students only)
router.put('/:logId', authenticate, authorize('student'), updateLog);

// Delete log
router.delete('/:logId', authenticate, deleteLog);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getAllAuditLogs,
  getAuditLogById,
  getAuditLogsByUser,
  getAuditStats,
  getActionTypes,
  deleteOldLogs,
  exportAuditLogs
} = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require ADMIN role

// Get all audit logs with filtering and pagination
router.get('/', authenticate, authorize('admin'), getAllAuditLogs);

// Get audit statistics
router.get('/stats', authenticate, authorize('admin'), getAuditStats);

// Get unique action types
router.get('/actions', authenticate, authorize('admin'), getActionTypes);

// Export audit logs to CSV
router.get('/export', authenticate, authorize('admin'), exportAuditLogs);

// Get audit log by ID
router.get('/:logId', authenticate, authorize('admin'), getAuditLogById);

// Get audit logs for specific user
router.get('/user/:userId', authenticate, authorize('admin'), getAuditLogsByUser);

// Delete old audit logs (cleanup)
router.delete('/cleanup', authenticate, authorize('admin'), deleteOldLogs);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  submitRemarks,
  submitMarks,
  checkRemarkStatus,
  checkMarksStatus,
  getMyRemarks,
  getMyMarks,
  getGroupEvaluations,
  getPresentationRemarks,
  getAllEvaluations
} = require('../controllers/evaluationController');
const { authenticate, authorize } = require('../middleware/auth');

// Submit remarks (Internal & External Examiners only)
router.post('/remarks/submit', authenticate, authorize('internalexaminer', 'externalexaminer'), submitRemarks);

// Submit marks (All examiners: supervisor, internal, external)
router.post('/marks/submit', authenticate, authorize('supervisor', 'internalexaminer', 'externalexaminer'), submitMarks);

// Check if remarks submitted for presentation
router.get('/remarks/check/:presentationId', authenticate, checkRemarkStatus);

// Check if marks submitted for group
router.get('/marks/check/:groupId', authenticate, checkMarksStatus);

// Get my remarks submissions
router.get('/remarks/my', authenticate, getMyRemarks);

// Get my marks submissions
router.get('/marks/my', authenticate, getMyMarks);

// Get all evaluations for a group (coordinator, admin)
router.get('/group/:groupId', authenticate, authorize('coordinator', 'admin'), getGroupEvaluations);

// Get remarks for a presentation (coordinator, admin)
router.get('/presentation/:presentationId/remarks', authenticate, getPresentationRemarks);

// Get all evaluations (Admin, Coordinator)
router.get('/', authenticate, authorize('admin', 'coordinator'), getAllEvaluations);

module.exports = router;


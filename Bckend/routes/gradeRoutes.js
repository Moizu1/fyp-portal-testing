const express = require('express');
const router = express.Router();
const {
  calculateFinalGrade,
  getAllGrades,
  getFinalGrade,
  getMyGrade,
  checkAllMarksSubmitted,
  getGroupMarksStatus
} = require('../controllers/gradeController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all final grades (Coordinator - for Final Grades page)
router.get('/', authenticate, authorize('coordinator'), getAllGrades);

// Get my grade (Student - for student dashboard)
router.get('/my-grade', authenticate, authorize('student'), getMyGrade);

// Calculate final grade (Coordinator only) - after all examiners submit marks
router.post('/calculate/:groupId', authenticate, authorize('coordinator'), calculateFinalGrade);

// Get final grade for a group
router.get('/group/:groupId', authenticate, getFinalGrade);

// Check if all marks are submitted for a group (Coordinator)
router.get('/check-marks/:groupId', authenticate, authorize('coordinator'), checkAllMarksSubmitted);

// Get marks submission status for a group (Coordinator)
router.get('/status/:groupId', authenticate, authorize('coordinator'), getGroupMarksStatus);

module.exports = router;


const express = require('express');
const router = express.Router();
const {
  createPresentation,
  getAllPresentations,
  getPresentationById,
  getPresentationsByGroup,
  getPresentationsForExaminer,
  updatePresentationStatus,
  updatePresentationResult
} = require('../controllers/presentationController');
const { authenticate, authorize } = require('../middleware/auth');

// Create presentation (Coordinator only)
router.post('/create', authenticate, authorize('coordinator'), createPresentation);

// Get all presentations (Coordinator, Admin)
router.get('/', authenticate, authorize('coordinator', 'admin'), getAllPresentations);

// Get presentation by ID
router.get('/:presentationId', authenticate, getPresentationById);

// Get presentations by group
router.get('/group/:groupId', authenticate, getPresentationsByGroup);

// Get presentations for examiner (including supervisors)
router.get('/examiner/my-presentations', authenticate, authorize('supervisor', 'internalexaminer', 'externalexaminer'), getPresentationsForExaminer);

// Update presentation status (Coordinator only)
router.put('/:presentationId/status', authenticate, authorize('coordinator'), updatePresentationStatus);

// Update presentation result (Coordinator only)
router.put('/:presentationId/result', authenticate, authorize('coordinator'), updatePresentationResult);

module.exports = router;

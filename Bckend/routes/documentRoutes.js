const express = require('express');
const router = express.Router();

const {
  uploadDocument,
  getDocumentsByGroup,
  getDocumentById,
  deleteDocument,
  getAllDocuments,
  getDocumentsForExaminer
} = require('../controllers/documentController');

const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../utils/uploadHelper');

// ================================
// Student Upload
// ================================
router.post(
  '/upload',
  authenticate,
  authorize('student'),
  upload.single('file'),
  uploadDocument
);

// ================================
// Examiner (STATIC route - keep BEFORE :id routes)
// ================================
router.get(
  '/examiner/my-documents',
  authenticate,
  authorize('internalexaminer', 'externalexaminer'),
  getDocumentsForExaminer
);

// ================================
// Get all documents (Admin / Coordinator)
// ================================
router.get(
  '/',
  authenticate,
  authorize('admin', 'coordinator'),
  getAllDocuments
);

// ================================
// Documents by Group
// ================================
router.get('/group/:groupId', authenticate, getDocumentsByGroup);

// ================================
// Get or Delete a single document
// MUST BE AT THE BOTTOM
// ================================
router.get('/:documentId', authenticate, getDocumentById);

router.delete('/:documentId', authenticate, deleteDocument);

module.exports = router;

const Document = require('../models/Document');
const Group = require('../models/Group');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/uploadHelper');
const { logAction, getIpAddress, getUserAgent } = require('../utils/auditLogger');

// ===============================
// Upload document (SDS / SRS / FINAL)
// ===============================
const uploadDocument = async (req, res) => {
  try {
    const { groupId, type } = req.body;

    if (!groupId || !type) {
      return res.status(400).json({ error: 'Group ID and document type are required' });
    }

    const normalizedType = type.toLowerCase();
    const validTypes = ['sds', 'srs', 'final'];
    if (!validTypes.includes(normalizedType)) {
      return res.status(400).json({ error: 'Invalid document type. Must be: sds, srs, or final' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Group validation
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.supervisorApproval !== 'APPROVED') {
      return res.status(403).json({ error: 'Project must be approved by supervisor before uploading documents' });
    }
    if (group.coordinatorApproval !== 'APPROVED') {
      return res.status(403).json({ error: 'Project must be approved by coordinator before uploading documents' });
    }

    const isMember = group.members.some(m => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // If old document exists → delete it
    const existing = await Document.findOne({ groupId, type: normalizedType });
    if (existing) {
      await deleteFromCloudinary(existing.publicId);
      await Document.findByIdAndDelete(existing._id);
    }

    // Folder based on type
    const folderMap = {
      sds: 'sds',
      srs: 'srs',
      final: 'final-report'
    };
    const folder = `fyp-portal/${folderMap[normalizedType]}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path, folder);

    // Save document entry in DB
    const document = new Document({
      groupId,
      type: normalizedType,
      fileUrl: result.url,        // UPDATED
      publicId: result.public_id, // UPDATED
      uploadedBy: req.user.id
    });

    await document.save();

    const populated = await Document.findById(document._id)
      .populate('groupId')
      .populate('uploadedBy', 'name email');

    // Audit Log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'DOCUMENT_UPLOADED',
      description: `Student uploaded ${normalizedType.toUpperCase()} document`,
      metadata: {
        documentId: document._id,
        groupId,
        type: normalizedType,
        fileUrl: result.url
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      url: result.url,
      publicId: result.public_id,
      document: populated
    });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// ===============================
// Get documents by group
// ===============================
const getDocumentsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const documents = await Document.find({ groupId })
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });

    res.json({ documents });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ===============================
// Get document by ID
// ===============================
const getDocumentById = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId)
      .populate('groupId')
      .populate('uploadedBy', 'name email');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ===============================
// Delete document
// ===============================
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId).populate('groupId');
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const isMember = document.groupId.members.some(m => m.toString() === req.user.id);
    const isAuthorized = isMember || ['admin', 'coordinator'].includes(req.user.role);

    if (!isAuthorized) return res.status(403).json({ error: 'Access denied' });

    await deleteFromCloudinary(document.publicId);
    await Document.findByIdAndDelete(documentId);

    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'DOCUMENT_DELETED',
      description: `${req.user.role} deleted ${document.type} document`,
      metadata: { documentId, groupId: document.groupId._id, type: document.type },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({ message: 'Document deleted successfully' });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ===============================
// Get all documents (admin/coordinator)
// ===============================
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate({
        path: 'groupId',
        populate: { path: 'members supervisorId', select: 'name email' }
      })
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });

    res.json({ documents });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ===============================
// Get documents for assigned examiner
// ===============================
const getDocumentsForExaminer = async (req, res) => {
  try {
    const examinerId = req.user.id;
    const Presentation = require('../models/Presentation');

    const presentations = await Presentation.find({
      $or: [
        { assignedInternalExaminer: examinerId },
        { assignedExternalExaminer: examinerId }
      ]
    });

    const groupIds = presentations.map(p => p.groupId);

    const documents = await Document.find({ groupId: { $in: groupIds } })
      .populate({
        path: 'groupId',
        populate: { path: 'members supervisorId', select: 'name email' }
      })
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });

    res.json({ documents });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  uploadDocument,
  getDocumentsByGroup,
  getDocumentById,
  deleteDocument,
  getAllDocuments,
  getDocumentsForExaminer
};

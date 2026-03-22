const Presentation = require('../models/Presentation');
const Group = require('../models/Group');
const User = require('../models/User');
const ExaminerAssignment = require('../models/ExaminerAssignment');
const { logAction, getIpAddress, getUserAgent } = require('../utils/auditLogger');

// Create presentation (Coordinator only)
const createPresentation = async (req, res) => {
  try {
    const { groupId, type, date, time } = req.body;

    // Validation
    if (!groupId || !type || !date || !time) {
      return res.status(400).json({ error: 'Group, type, date, and time are required' });
    }

    const validTypes = ['INITIAL', 'INTERM1', 'INTERM2', 'FINAL'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid presentation type' });
    }

    // Verify group exists and has examiners assigned (except for INITIAL)
    const group = await Group.findById(groupId)
      .populate('supervisorId', 'name email')
      .populate('members', 'name email')
      .populate('internalExaminers', 'name email')
      .populate('externalExaminer', 'name email');
      
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // For INTERM1, INTERM2, and FINAL, ensure examiners are assigned
    if (type !== 'INITIAL') {
      if (!group.internalExaminers || group.internalExaminers.length !== 2) {
        return res.status(400).json({ error: 'Group must have 2 internal examiners assigned before scheduling this presentation' });
      }
      
      if (type === 'FINAL' && !group.externalExaminer) {
        return res.status(400).json({ error: 'Group must have an external examiner assigned before scheduling FINAL presentation' });
      }
    }

    // Create presentation
    const presentation = new Presentation({
      groupId,
      type,
      date,
      time
    });

    await presentation.save();

    const populatedPresentation = await Presentation.findById(presentation._id)
      .populate({
        path: 'groupId',
        populate: [
          { path: 'supervisorId', select: 'name email' },
          { path: 'members', select: 'name email' },
          { path: 'internalExaminers', select: 'name email' },
          { path: 'externalExaminer', select: 'name email' }
        ]
      });

    // Determine who will be notified based on presentation type
    let notifiedRoles = ['supervisor', 'students'];
    if (type === 'INTERM1' || type === 'INTERM2') {
      notifiedRoles.push('internal examiners (2)');
    } else if (type === 'FINAL') {
      notifiedRoles.push('internal examiners (2)', 'external examiner');
    }

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'PRESENTATION_SCHEDULED',
      description: `Coordinator scheduled ${type} presentation for group "${group.groupName}"`,
      metadata: {
        presentationId: presentation._id,
        groupId,
        groupName: group.groupName,
        type,
        date,
        time,
        notifiedRoles
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      message: 'Presentation scheduled successfully',
      presentation: populatedPresentation,
      notifiedRoles
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// Get all presentations
const getAllPresentations = async (req, res) => {
  try {
    const presentations = await Presentation.find()
      .populate({
        path: 'groupId',
        populate: [
          { path: 'members', select: 'name email' },
          { path: 'supervisorId', select: 'name email' },
          { path: 'internalExaminers', select: 'name email' },
          { path: 'externalExaminer', select: 'name email' }
        ]
      })
      .sort({ date: 1 });

    res.json({ presentations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get presentation by ID
const getPresentationById = async (req, res) => {
  try {
    const { presentationId } = req.params;

    const presentation = await Presentation.findById(presentationId)
      .populate({
        path: 'groupId',
        populate: [
          { path: 'members', select: 'name email' },
          { path: 'supervisorId', select: 'name email' },
          { path: 'internalExaminers', select: 'name email' },
          { path: 'externalExaminer', select: 'name email' }
        ]
      });

    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    res.json({ presentation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get presentations by group
const getPresentationsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const presentations = await Presentation.find({ groupId })
      .populate({
        path: 'groupId',
        populate: [
          { path: 'members', select: 'name email' },
          { path: 'supervisorId', select: 'name email' },
          { path: 'internalExaminers', select: 'name email' },
          { path: 'externalExaminer', select: 'name email' }
        ]
      })
      .sort({ date: 1 });

    res.json({ presentations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get presentations for examiner
const getPresentationsForExaminer = async (req, res) => {
  try {
    const examinerId = req.user.id;
    const examinerRole = req.user.role;

    // Find groups where examiner is assigned
    let groupQuery = {};
    if (examinerRole === 'supervisor') {
      groupQuery = { supervisorId: examinerId };
    } else if (examinerRole === 'internalexaminer') {
      groupQuery = { internalExaminers: examinerId };
    } else if (examinerRole === 'externalexaminer') {
      groupQuery = { externalExaminer: examinerId };
    } else {
      return res.json({ presentations: [] });
    }

    const groups = await Group.find(groupQuery).select('_id');
    const groupIds = groups.map(g => g._id);

    // Find presentations for these groups
    let presentations = await Presentation.find({ groupId: { $in: groupIds } })
      .populate({
        path: 'groupId',
        populate: [
          { path: 'members', select: 'name email' },
          { path: 'supervisorId', select: 'name email' },
          { path: 'internalExaminers', select: 'name email' },
          { path: 'externalExaminer', select: 'name email' }
        ]
      })
      .sort({ date: 1 });

    // Filter based on presentation type and examiner role
    if (examinerRole === 'externalexaminer') {
      // External examiners only see FINAL presentations
      presentations = presentations.filter(p => p.type === 'FINAL');
    } else if (examinerRole === 'internalexaminer') {
      // Internal examiners see INTERM1, INTERM2, and FINAL
      presentations = presentations.filter(p => ['INTERM1', 'INTERM2', 'FINAL'].includes(p.type));
    }

    res.json({ presentations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update presentation status
const updatePresentationStatus = async (req, res) => {
  try {
    const { presentationId } = req.params;
    const { status } = req.body;

    const validStatuses = ['SCHEDULED', 'COMPLETED', 'EVALUATED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const presentation = await Presentation.findById(presentationId);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    presentation.status = status;
    await presentation.save();

    const populatedPresentation = await Presentation.findById(presentation._id)
      .populate({
        path: 'groupId',
        populate: [
          { path: 'members', select: 'name email' },
          { path: 'supervisorId', select: 'name email' },
          { path: 'internalExaminers', select: 'name email' },
          { path: 'externalExaminer', select: 'name email' }
        ]
      });

    res.json({
      message: 'Presentation status updated successfully',
      presentation: populatedPresentation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update presentation result (for initial presentation)
const updatePresentationResult = async (req, res) => {
  try {
    const { presentationId } = req.params;
    const { result } = req.body; // APPROVED | REJECTED | DEFERRED

    const validResults = ['APPROVED', 'REJECTED', 'DEFERRED'];
    if (!validResults.includes(result)) {
      return res.status(400).json({ error: 'Invalid result' });
    }

    const presentation = await Presentation.findById(presentationId);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    presentation.result = result;
    
    // Update group status if initial presentation is approved
    if (presentation.type === 'INITIAL' && result === 'APPROVED') {
      const group = await Group.findById(presentation.groupId);
      if (group) {
        group.status = 'INITIAL_APPROVED';
        await group.save();
      }
    }

    await presentation.save();

    const populatedPresentation = await Presentation.findById(presentation._id)
      .populate({
        path: 'groupId',
        populate: [
          { path: 'members', select: 'name email' },
          { path: 'supervisorId', select: 'name email' },
          { path: 'internalExaminers', select: 'name email' },
          { path: 'externalExaminer', select: 'name email' }
        ]
      });

    res.json({
      message: 'Presentation result updated successfully',
      presentation: populatedPresentation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createPresentation,
  getAllPresentations,
  getPresentationById,
  getPresentationsByGroup,
  getPresentationsForExaminer,
  updatePresentationStatus,
  updatePresentationResult
};

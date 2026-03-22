const Evaluation = require('../models/Evaluation');
const Presentation = require('../models/Presentation');
const Group = require('../models/Group');
const { logAction, getIpAddress, getUserAgent } = require('../utils/auditLogger');

// ============ REMARKS SUBMISSION ============
// Examiners submit remarks for presentations they must attend

const submitRemarks = async (req, res) => {
  try {
    const { presentationId, remarks } = req.body;
    const examinerId = req.user.id;
    const examinerRole = req.user.role;

    // Validation
    if (!presentationId || !remarks) {
      return res.status(400).json({ error: 'Presentation ID and remarks are required' });
    }

    // Verify presentation exists
    const presentation = await Presentation.findById(presentationId)
      .populate({
        path: 'groupId',
        populate: [
          { path: 'supervisorId' },
          { path: 'internalExaminers' },
          { path: 'externalExaminer' }
        ]
      });
      
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    // Verify presentation is marked as COMPLETED
    if (presentation.status !== 'COMPLETED') {
      return res.status(400).json({ 
        error: 'Presentation must be marked as COMPLETED before examiners can submit remarks',
        currentStatus: presentation.status 
      });
    }

    const group = presentation.groupId;

    // Determine examiner role and validate authorization
    let finalExaminerRole;
    
    if (group.supervisorId._id.toString() === examinerId) {
      finalExaminerRole = 'supervisor';
    } else if (group.internalExaminers && group.internalExaminers.length >= 2) {
      if (group.internalExaminers[0]._id.toString() === examinerId) {
        finalExaminerRole = 'internal1';
      } else if (group.internalExaminers[1]._id.toString() === examinerId) {
        finalExaminerRole = 'internal2';
      }
    }
    
    if (!finalExaminerRole && group.externalExaminer && group.externalExaminer._id.toString() === examinerId) {
      finalExaminerRole = 'external';
    }

    if (!finalExaminerRole) {
      return res.status(403).json({ error: 'You are not authorized to evaluate this presentation' });
    }

    // Validate who can submit remarks for which presentation type
    if (finalExaminerRole === 'external' && presentation.type !== 'FINAL') {
      return res.status(403).json({ error: 'External examiners can only submit remarks for FINAL presentations' });
    }

    if ((finalExaminerRole === 'internal1' || finalExaminerRole === 'internal2') && presentation.type === 'INITIAL') {
      return res.status(403).json({ error: 'Internal examiners cannot submit remarks for INITIAL presentations' });
    }

    // Supervisors don't submit remarks for presentations
    if (finalExaminerRole === 'supervisor') {
      return res.status(403).json({ error: 'Supervisors do not submit remarks for presentations' });
    }

    // Check if remarks already exist for this presentation and examiner
    let evaluation = await Evaluation.findOne({ presentationId, examinerId });
    
    if (!evaluation) {
      // Create new evaluation record
      evaluation = new Evaluation({
        presentationId,
        groupId: group._id,
        examinerId,
        examinerRole: finalExaminerRole,
        remarks,
        remarksSubmittedAt: new Date()
      });
    } else {
      // Update existing remarks
      evaluation.remarks = remarks;
      evaluation.remarksSubmittedAt = new Date();
    }

    await evaluation.save();

    const populatedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('presentationId')
      .populate('groupId')
      .populate('examinerId', 'name email');

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'REMARKS_SUBMITTED',
      description: `${finalExaminerRole} examiner submitted remarks for ${presentation.type} presentation`,
      metadata: {
        evaluationId: evaluation._id,
        presentationId,
        groupId: group._id,
        examinerRole: finalExaminerRole,
        presentationType: presentation.type
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      message: 'Remarks submitted successfully',
      evaluation: populatedEvaluation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============ MARKS SUBMISSION ============
// Examiners submit marks (final grading)

const submitMarks = async (req, res) => {
  try {
    const { groupId, marks } = req.body;
    const examinerId = req.user.id;
    const examinerRole = req.user.role;

    // Validation
    if (!groupId || marks === undefined) {
      return res.status(400).json({ error: 'Group ID and marks are required' });
    }

    // Validate marks range
    if (marks < 0 || marks > 100) {
      return res.status(400).json({ error: 'Marks must be between 0 and 100' });
    }

    // Verify group exists
    const group = await Group.findById(groupId)
      .populate('supervisorId')
      .populate('internalExaminers')
      .populate('externalExaminer');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Determine examiner role and validate authorization
    let finalExaminerRole;
    
    if (group.supervisorId._id.toString() === examinerId) {
      finalExaminerRole = 'supervisor';
    } else if (group.internalExaminers && group.internalExaminers.length >= 2) {
      if (group.internalExaminers[0]._id.toString() === examinerId) {
        finalExaminerRole = 'internal1';
      } else if (group.internalExaminers[1]._id.toString() === examinerId) {
        finalExaminerRole = 'internal2';
      }
    }
    
    if (!finalExaminerRole && group.externalExaminer && group.externalExaminer._id.toString() === examinerId) {
      finalExaminerRole = 'external';
    }

    if (!finalExaminerRole) {
      return res.status(403).json({ error: 'You are not authorized to mark this group' });
    }

    // Check role-specific conditions
    if (finalExaminerRole === 'internal1' || finalExaminerRole === 'internal2') {
      // Internal examiners: must have submitted remarks for INTERM1, INTERM2, FINAL
      // (They CANNOT submit remarks for INITIAL, so exclude it from validation)
      const requiredPresentations = await Presentation.find({ 
        groupId, 
        type: { $in: ['INTERM1', 'INTERM2', 'FINAL'] } 
      });

      if (requiredPresentations.length === 0) {
        return res.status(400).json({ error: 'No presentations found for this group' });
      }

      // Check if all required presentations are COMPLETED
      const incompletePresentations = requiredPresentations.filter(p => p.status !== 'COMPLETED');
      if (incompletePresentations.length > 0) {
        return res.status(400).json({ 
          error: `All required presentations must be marked as COMPLETED. Incomplete presentations: ${incompletePresentations.map(p => p.type).join(', ')}`
        });
      }

      // Check if remarks submitted for all required presentations
      const remarksCount = await Evaluation.countDocuments({
        groupId,
        examinerId,
        examinerRole: finalExaminerRole,
        remarksSubmittedAt: { $ne: null }
      });

      if (remarksCount !== requiredPresentations.length) {
        return res.status(400).json({ 
          error: 'You must submit remarks for all required presentations (INTERM1, INTERM2, FINAL) before submitting final marks',
          submittedRemarksCount: remarksCount,
          requiredCount: requiredPresentations.length
        });
      }
    } else if (finalExaminerRole === 'external') {
      // External examiner: must have submitted remarks for FINAL presentation
      const finalPresentation = await Presentation.findOne({ groupId, type: 'FINAL' });
      if (!finalPresentation) {
        return res.status(400).json({ error: 'Final presentation not found for this group' });
      }

      // Check if final presentation is COMPLETED
      if (finalPresentation.status !== 'COMPLETED') {
        return res.status(400).json({ 
          error: 'Final presentation must be marked as COMPLETED before you can submit marks',
          currentStatus: finalPresentation.status
        });
      }

      const remarksSubmitted = await Evaluation.findOne({
        presentationId: finalPresentation._id,
        examinerId,
        examinerRole: 'external',
        remarksSubmittedAt: { $ne: null }
      });

      if (!remarksSubmitted) {
        return res.status(400).json({ error: 'You must submit remarks for the final presentation first' });
      }
    } else if (finalExaminerRole === 'supervisor') {
      // Supervisor: can only mark after all final presentations are completed
      const allPresentations = await Presentation.find({ groupId });
      const finalPresentation = await Presentation.findOne({ groupId, type: 'FINAL' });

      if (!finalPresentation || finalPresentation.status !== 'COMPLETED') {
        return res.status(400).json({ error: 'You can only submit marks after the final presentation is completed' });
      }
    }

    // Check if evaluation record exists for this group and examiner
    let evaluation = await Evaluation.findOne({ groupId, examinerId, examinerRole: finalExaminerRole });
    
    if (!evaluation) {
      // Create new evaluation record for marks
      evaluation = new Evaluation({
        groupId,
        examinerId,
        examinerRole: finalExaminerRole,
        marks,
        marksSubmittedAt: new Date()
      });
    } else {
      // Update existing marks
      evaluation.marks = marks;
      evaluation.marksSubmittedAt = new Date();
    }

    await evaluation.save();

    const populatedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('groupId', 'groupName')
      .populate('examinerId', 'name email');

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'MARKS_SUBMITTED',
      description: `${finalExaminerRole} examiner submitted marks for group "${group.groupName}"`,
      metadata: {
        evaluationId: evaluation._id,
        groupId: group._id,
        groupName: group.groupName,
        examinerRole: finalExaminerRole,
        marks
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      message: 'Marks submitted successfully',
      evaluation: populatedEvaluation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============ CHECK SUBMISSION STATUS ============

const checkRemarkStatus = async (req, res) => {
  try {
    const { presentationId } = req.params;
    const examinerId = req.user.id;

    const evaluation = await Evaluation.findOne({ presentationId, examinerId });

    res.json({
      remarksSubmitted: !!evaluation?.remarksSubmittedAt,
      evaluation: evaluation ? {
        remarks: evaluation.remarks,
        remarksSubmittedAt: evaluation.remarksSubmittedAt
      } : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const checkMarksStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const examinerId = req.user.id;

    const evaluation = await Evaluation.findOne({ groupId, examinerId });

    res.json({
      marksSubmitted: !!evaluation?.marksSubmittedAt,
      evaluation: evaluation ? {
        marks: evaluation.marks,
        marksSubmittedAt: evaluation.marksSubmittedAt,
        examinerRole: evaluation.examinerRole
      } : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============ GET EVALUATIONS ============

const getMyRemarks = async (req, res) => {
  try {
    const examinerId = req.user.id;

    const evaluations = await Evaluation.find({ 
      examinerId,
      remarksSubmittedAt: { $ne: null }
    })
      .populate('presentationId')
      .populate('groupId', 'groupName')
      .sort({ remarksSubmittedAt: -1 });

    res.json({ evaluations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getMyMarks = async (req, res) => {
  try {
    const examinerId = req.user.id;

    const evaluations = await Evaluation.find({ 
      examinerId,
      marksSubmittedAt: { $ne: null }
    })
      .populate('groupId', 'groupName')
      .sort({ marksSubmittedAt: -1 });

    res.json({ evaluations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getGroupEvaluations = async (req, res) => {
  try {
    const { groupId } = req.params;

    const evaluations = await Evaluation.find({ groupId, marksSubmittedAt: { $ne: null } })
      .populate('examinerId', 'name email')
      .sort({ marksSubmittedAt: -1 });

    res.json({ evaluations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getPresentationRemarks = async (req, res) => {
  try {
    const { presentationId } = req.params;

    const evaluations = await Evaluation.find({ 
      presentationId,
      remarksSubmittedAt: { $ne: null }
    })
      .populate('examinerId', 'name email role')
      .sort({ remarksSubmittedAt: -1 });

    res.json({ evaluations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all evaluations (admin, coordinator)
const getAllEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
      .populate('groupId', 'groupName')
      .populate('examinerId', 'name email role')
      .sort({ marksSubmittedAt: -1 });

    res.json({ evaluations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  submitRemarks,
  submitMarks,
  checkRemarkStatus,
  checkMarksStatus,
  getMyRemarks,
  getMyMarks,
  getGroupEvaluations,
  getPresentationRemarks,
  getAllEvaluations
};

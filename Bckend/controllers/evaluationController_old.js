const Evaluation = require('../models/Evaluation');
const Presentation = require('../models/Presentation');
const Group = require('../models/Group');
const { logAction, getIpAddress, getUserAgent } = require('../utils/auditLogger');

// Submit evaluation (Supervisor, Internal Examiner, External Examiner)
const submitEvaluation = async (req, res) => {
  try {
    const { presentationId, marks, remarks } = req.body;
    const examinerId = req.user.id;
    const examinerUserRole = req.user.role;

    // Validation
    if (!presentationId || marks === undefined) {
      return res.status(400).json({ error: 'Presentation ID and marks are required' });
    }

    // Validate marks range
    if (marks < 0 || marks > 100) {
      return res.status(400).json({ error: 'Marks must be between 0 and 100' });
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

    const group = presentation.groupId;

    // Determine examiner role and validate authorization
    let examinerRole;
    
    if (group.supervisorId._id.toString() === examinerId) {
      examinerRole = 'supervisor';
    } else if (group.internalExaminers && group.internalExaminers.length >= 2) {
      if (group.internalExaminers[0]._id.toString() === examinerId) {
        examinerRole = 'internal1';
      } else if (group.internalExaminers[1]._id.toString() === examinerId) {
        examinerRole = 'internal2';
      }
    }
    
    if (!examinerRole && group.externalExaminer && group.externalExaminer._id.toString() === examinerId) {
      examinerRole = 'external';
    }

    if (!examinerRole) {
      return res.status(403).json({ error: 'You are not authorized to evaluate this presentation' });
    }

    // Validate examiner can evaluate based on presentation type
    if (examinerRole === 'external' && presentation.type !== 'FINAL') {
      return res.status(403).json({ error: 'External examiners can only evaluate FINAL presentations' });
    }

    if ((examinerRole === 'internal1' || examinerRole === 'internal2') && presentation.type === 'INITIAL') {
      return res.status(403).json({ error: 'Internal examiners cannot evaluate INITIAL presentations' });
    }

    // Check if evaluation already exists
    const existingEvaluation = await Evaluation.findOne({ presentationId, examinerId });
    if (existingEvaluation) {
      return res.status(400).json({ error: 'You have already submitted evaluation for this presentation' });
    }

    // Create evaluation
    const evaluation = new Evaluation({
      presentationId,
      groupId: group._id,
      examinerId,
      examinerRole,
      marks,
      remarks: remarks || ''
    });

    await evaluation.save();

    // Check if all evaluations are submitted for final presentation
    if (presentation.type === 'FINAL') {
      const evaluationsCount = await Evaluation.countDocuments({ presentationId });
      // 4 evaluators: supervisor + internal1 + internal2 + external
      if (evaluationsCount === 4) {
        presentation.status = 'EVALUATED';
        await presentation.save();
      }
    }

    const populatedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('presentationId')
      .populate('groupId')
      .populate('examinerId', 'name email');

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'EVALUATION_SUBMITTED',
      description: `${examinerRole} examiner submitted evaluation for ${presentation.type} presentation`,
      metadata: {
        evaluationId: evaluation._id,
        presentationId,
        groupId: group._id,
        examinerRole,
        marks,
        presentationType: presentation.type
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      message: 'Evaluation submitted successfully',
      evaluation: populatedEvaluation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get evaluations by presentation
const getEvaluationsByPresentation = async (req, res) => {
  try {
    const { presentationId } = req.params;

    const evaluations = await Evaluation.find({ presentationId })
      .populate('examinerId', 'name email role')
      .sort({ submittedAt: 1 });

    res.json({ evaluations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get evaluations by group
const getEvaluationsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const evaluations = await Evaluation.find({ groupId })
      .populate('presentationId')
      .populate('examinerId', 'name email role')
      .sort({ submittedAt: -1 });

    res.json({ evaluations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get evaluations submitted by examiner
const getEvaluationsByExaminer = async (req, res) => {
  try {
    const examinerId = req.user.id;

    const evaluations = await Evaluation.find({ examinerId })
      .populate({
        path: 'presentationId',
        populate: {
          path: 'groupId',
          populate: {
            path: 'members supervisorId',
            select: 'name email'
          }
        }
      })
      .populate('groupId')
      .sort({ submittedAt: -1 });

    res.json({ evaluations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all evaluations (Admin, Coordinator)
const getAllEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
      .populate({
        path: 'presentationId',
        populate: {
          path: 'groupId',
          populate: {
            path: 'members supervisorId',
            select: 'name email'
          }
        }
      })
      .populate('groupId')
      .populate('examinerId', 'name email role')
      .sort({ submittedAt: -1 });

    res.json({ evaluations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Check if examiner has submitted evaluation
const checkEvaluationStatus = async (req, res) => {
  try {
    const { presentationId } = req.params;
    const examinerId = req.user.id;

    const evaluation = await Evaluation.findOne({ presentationId, examinerId });

    res.json({
      submitted: !!evaluation,
      evaluation: evaluation ? {
        marks: evaluation.marks,
        remarks: evaluation.remarks,
        submittedAt: evaluation.submittedAt
      } : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get final presentation evaluations (for grade calculation)
const getFinalEvaluations = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Find final presentation for this group
    const finalPresentation = await Presentation.findOne({
      groupId,
      type: 'FINAL'
    });

    if (!finalPresentation) {
      return res.status(404).json({ error: 'Final presentation not found for this group' });
    }

    // Get all evaluations for final presentation
    const evaluations = await Evaluation.find({ presentationId: finalPresentation._id })
      .populate('examinerId', 'name email role');

    // Organize evaluations by role
    const supervisorEval = evaluations.find(e => e.examinerRole === 'supervisor');
    const internalEval = evaluations.find(e => e.examinerRole === 'INTERNAL');
    const externalEval = evaluations.find(e => e.examinerRole === 'EXTERNAL');

    res.json({
      supervisorMarks: supervisorEval?.marks || null,
      internalMarks: internalEval?.marks || null,
      externalMarks: externalEval?.marks || null,
      allEvaluationsSubmitted: !!(supervisorEval && internalEval && externalEval),
      evaluations: {
        supervisor: supervisorEval || null,
        internal: internalEval || null,
        external: externalEval || null
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  submitEvaluation,
  getEvaluationsByPresentation,
  getEvaluationsByGroup,
  getEvaluationsByExaminer,
  getAllEvaluations,
  checkEvaluationStatus,
  getFinalEvaluations
};

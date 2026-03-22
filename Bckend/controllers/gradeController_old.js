const Group = require('../models/Group');
const Evaluation = require('../models/Evaluation');
const Presentation = require('../models/Presentation');
const { logAction, getIpAddress, getUserAgent } = require('../utils/auditLogger');

// Calculate final grade (Coordinator only)
const calculateFinalGrade = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Find the group
    const group = await Group.findById(groupId)
      .populate('members', 'name email')
      .populate('supervisorId', 'name email')
      .populate('internalExaminers', 'name email')
      .populate('externalExaminer', 'name email');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Find final presentation
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
    const internal1Eval = evaluations.find(e => e.examinerRole === 'internal1');
    const internal2Eval = evaluations.find(e => e.examinerRole === 'internal2');
    const externalEval = evaluations.find(e => e.examinerRole === 'external');

    // Check if all evaluations are submitted
    if (!supervisorEval || !internal1Eval || !internal2Eval || !externalEval) {
      return res.status(400).json({
        error: 'All evaluations must be submitted before calculating final grade',
        missing: {
          supervisor: !supervisorEval,
          internal1: !internal1Eval,
          internal2: !internal2Eval,
          external: !externalEval
        }
      });
    }

    // Calculate final grade with new weighted formula
    // Supervisor: 40%, Internal1: 15%, Internal2: 15%, External: 30%
    const supervisorMarks = supervisorEval.marks;
    const internal1Marks = internal1Eval.marks;
    const internal2Marks = internal2Eval.marks;
    const externalMarks = externalEval.marks;

    const finalGrade = (supervisorMarks * 0.40) + 
                       (internal1Marks * 0.15) + 
                       (internal2Marks * 0.15) + 
                       (externalMarks * 0.30);

    // Round to 2 decimal places
    const roundedFinalGrade = Math.round(finalGrade * 100) / 100;

    // Update group with final grade and status
    group.finalGrade = roundedFinalGrade;
    group.status = 'COMPLETED';
    await group.save();

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'GRADE_CALCULATED',
      description: `Coordinator calculated final grade for group "${group.groupName}"`,
      metadata: {
        groupId: group._id,
        groupName: group.groupName,
        finalGrade: roundedFinalGrade,
        supervisorMarks,
        internal1Marks,
        internal2Marks,
        externalMarks,
        calculationMethod: 'weighted (40-15-15-30)'
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      message: 'Final grade calculated successfully',
      group: {
        id: group._id,
        groupName: group.groupName,
        members: group.members,
        supervisor: group.supervisorId
      },
      marks: {
        supervisor: supervisorMarks,
        internal1: internal1Marks,
        internal2: internal2Marks,
        external: externalMarks
      },
      weights: {
        supervisor: '40%',
        internal1: '15%',
        internal2: '15%',
        external: '30%'
      },
      finalGrade: roundedFinalGrade,
      calculationMethod: 'Weighted Average: Supervisor 40%, Internal1 15%, Internal2 15%, External 30%'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get final grade for a group
const getFinalGrade = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('members', 'name email')
      .populate('supervisorId', 'name email')
      .populate('internalExaminers', 'name email')
      .populate('externalExaminer', 'name email');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.finalGrade === null) {
      return res.status(404).json({ error: 'Final grade not yet calculated for this group' });
    }

    // Get final presentation evaluations
    const finalPresentation = await Presentation.findOne({
      groupId,
      type: 'FINAL'
    });

    let evaluationDetails = null;
    if (finalPresentation) {
      const evaluations = await Evaluation.find({ presentationId: finalPresentation._id })
        .populate('examinerId', 'name email role');

      const supervisorEval = evaluations.find(e => e.examinerRole === 'supervisor');
      const internal1Eval = evaluations.find(e => e.examinerRole === 'internal1');
      const internal2Eval = evaluations.find(e => e.examinerRole === 'internal2');
      const externalEval = evaluations.find(e => e.examinerRole === 'external');

      evaluationDetails = {
        supervisor: supervisorEval ? { 
          marks: supervisorEval.marks, 
          remarks: supervisorEval.remarks,
          examiner: supervisorEval.examinerId 
        } : null,
        internal1: internal1Eval ? { 
          marks: internal1Eval.marks, 
          remarks: internal1Eval.remarks,
          examiner: internal1Eval.examinerId 
        } : null,
        internal2: internal2Eval ? { 
          marks: internal2Eval.marks, 
          remarks: internal2Eval.remarks,
          examiner: internal2Eval.examinerId 
        } : null,
        external: externalEval ? { 
          marks: externalEval.marks, 
          remarks: externalEval.remarks,
          examiner: externalEval.examinerId 
        } : null
      };
    }

    res.json({
      group: {
        id: group._id,
        groupName: group.groupName,
        members: group.members,
        supervisor: group.supervisorId,
        internalExaminers: group.internalExaminers,
        externalExaminer: group.externalExaminer,
        ideaTitle: group.ideaTitle
      },
      finalGrade: group.finalGrade,
      status: group.status,
      evaluations: evaluationDetails,
      weights: {
        supervisor: '40%',
        internal1: '15%',
        internal2: '15%',
        external: '30%'
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all completed groups with grades
const getAllGrades = async (req, res) => {
  try {
    const groups = await Group.find({ status: 'COMPLETED', finalGrade: { $ne: null } })
      .populate('members', 'name email')
      .populate('supervisorId', 'name email')
      .sort({ finalGrade: -1 });

    res.json({
      count: groups.length,
      groups: groups.map(group => ({
        id: group._id,
        groupName: group.groupName,
        members: group.members,
        supervisor: group.supervisorId,
        ideaTitle: group.ideaTitle,
        finalGrade: group.finalGrade,
        status: group.status
      }))
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Student view their grade
const getMyGrade = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find group where student is a member
    const group = await Group.findOne({ members: studentId })
      .populate('members', 'name email')
      .populate('supervisorId', 'name email');

    if (!group) {
      return res.status(404).json({ error: 'You are not part of any group' });
    }

    if (group.finalGrade === null) {
      return res.status(404).json({ 
        error: 'Final grade not yet available',
        group: {
          groupName: group.groupName,
          status: group.status
        }
      });
    }

    // Get final presentation evaluations
    const finalPresentation = await Presentation.findOne({
      groupId: group._id,
      type: 'FINAL'
    });

    let evaluationDetails = null;
    if (finalPresentation) {
      const evaluations = await Evaluation.find({ presentationId: finalPresentation._id })
        .populate('examinerId', 'name email role');

      const supervisorEval = evaluations.find(e => e.examinerRole === 'supervisor');
      const internalEval = evaluations.find(e => e.examinerRole === 'internal');
      const externalEval = evaluations.find(e => e.examinerRole === 'external');

      evaluationDetails = {
        supervisor: supervisorEval ? { marks: supervisorEval.marks, remarks: supervisorEval.remarks } : null,
        internal: internalEval ? { marks: internalEval.marks, remarks: internalEval.remarks } : null,
        external: externalEval ? { marks: externalEval.marks, remarks: externalEval.remarks } : null
      };
    }

    res.json({
      group: {
        groupName: group.groupName,
        members: group.members,
        supervisor: group.supervisorId,
        ideaTitle: group.ideaTitle
      },
      finalGrade: group.finalGrade,
      status: group.status,
      evaluations: evaluationDetails
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  calculateFinalGrade,
  getFinalGrade,
  getAllGrades,
  getMyGrade
};

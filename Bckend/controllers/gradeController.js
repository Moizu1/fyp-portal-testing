const Group = require('../models/Group');
const Evaluation = require('../models/Evaluation');
const Presentation = require('../models/Presentation');
const { logAction, getIpAddress, getUserAgent } = require('../utils/auditLogger');

// Calculate final grade (Coordinator only)
// Only after all examiners have submitted marks
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

    // Get all required evaluations (marks only)
    const supervisorEval = await Evaluation.findOne({
      groupId,
      examinerRole: 'supervisor',
      marksSubmittedAt: { $ne: null }
    }).populate('examinerId', 'name email');

    const internal1Eval = await Evaluation.findOne({
      groupId,
      examinerRole: 'internal1',
      marksSubmittedAt: { $ne: null }
    }).populate('examinerId', 'name email');

    const internal2Eval = await Evaluation.findOne({
      groupId,
      examinerRole: 'internal2',
      marksSubmittedAt: { $ne: null }
    }).populate('examinerId', 'name email');

    const externalEval = await Evaluation.findOne({
      groupId,
      examinerRole: 'external',
      marksSubmittedAt: { $ne: null }
    }).populate('examinerId', 'name email');

    // Check if all marks are submitted
    if (!supervisorEval || !internal1Eval || !internal2Eval || !externalEval) {
      const missing = [];
      if (!supervisorEval) missing.push('Supervisor');
      if (!internal1Eval) missing.push('Internal Examiner 1');
      if (!internal2Eval) missing.push('Internal Examiner 2');
      if (!externalEval) missing.push('External Examiner');

      return res.status(400).json({
        error: 'All evaluators must submit marks before calculating final grade',
        missing,
        submitted: {
          supervisor: !!supervisorEval,
          internal1: !!internal1Eval,
          internal2: !!internal2Eval,
          external: !!externalEval
        }
      });
    }

    // Calculate final grade with weighted formula
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
      action: 'FINAL_GRADE_CALCULATED',
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
        supervisor: group.supervisorId,
        internalExaminers: group.internalExaminers,
        externalExaminer: group.externalExaminer
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

// Get all final grades (Coordinator - for Final Grades page)
const getAllGrades = async (req, res) => {
  try {
    // Get all groups with final grades calculated
    const groups = await Group.find({ finalGrade: { $ne: null } })
      .populate('members', 'name email')
      .populate('supervisorId', 'name email')
      .populate('ideaTitle')
      .select('_id groupName ideaTitle finalGrade status members supervisorId');

    // Format response for frontend
    const gradesData = groups.map(group => ({
      id: group._id,
      groupName: group.groupName,
      ideaTitle: group.ideaTitle,
      finalGrade: group.finalGrade,
      status: group.status,
      members: group.members,
      supervisor: group.supervisorId
    }));

    res.json(gradesData);
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

    // Get all evaluations for this group
    const evaluations = await Evaluation.find({ 
      groupId,
      marksSubmittedAt: { $ne: null }
    })
      .populate('examinerId', 'name email');

    // Organize by role
    const supervisorEval = evaluations.find(e => e.examinerRole === 'supervisor');
    const internal1Eval = evaluations.find(e => e.examinerRole === 'internal1');
    const internal2Eval = evaluations.find(e => e.examinerRole === 'internal2');
    const externalEval = evaluations.find(e => e.examinerRole === 'external');

    res.json({
      message: 'Final grade retrieved successfully',
      group: {
        id: group._id,
        groupName: group.groupName,
        members: group.members,
        supervisor: group.supervisorId,
        internalExaminers: group.internalExaminers,
        externalExaminer: group.externalExaminer
      },
      finalGrade: group.finalGrade,
      marks: {
        supervisor: supervisorEval?.marks || null,
        internal1: internal1Eval?.marks || null,
        internal2: internal2Eval?.marks || null,
        external: externalEval?.marks || null
      },
      evaluations: {
        supervisor: supervisorEval || null,
        internal1: internal1Eval || null,
        internal2: internal2Eval || null,
        external: externalEval || null
      },
      weights: {
        supervisor: '40%',
        internal1: '15%',
        internal2: '15%',
        external: '30%'
      },
      calculationMethod: 'Weighted Average: Supervisor 40%, Internal1 15%, Internal2 15%, External 30%'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Check if all marks are submitted for a group
const checkAllMarksSubmitted = async (req, res) => {
  try {
    const { groupId } = req.params;

    const supervisorEval = await Evaluation.findOne({
      groupId,
      examinerRole: 'supervisor',
      marksSubmittedAt: { $ne: null }
    });

    const internal1Eval = await Evaluation.findOne({
      groupId,
      examinerRole: 'internal1',
      marksSubmittedAt: { $ne: null }
    });

    const internal2Eval = await Evaluation.findOne({
      groupId,
      examinerRole: 'internal2',
      marksSubmittedAt: { $ne: null }
    });

    const externalEval = await Evaluation.findOne({
      groupId,
      examinerRole: 'external',
      marksSubmittedAt: { $ne: null }
    });

    const allSubmitted = !!(supervisorEval && internal1Eval && internal2Eval && externalEval);

    res.json({
      allSubmitted,
      submitted: {
        supervisor: !!supervisorEval,
        internal1: !!internal1Eval,
        internal2: !!internal2Eval,
        external: !!externalEval
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get evaluations for a group (for coordinator to see submission status)
const getGroupMarksStatus = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('supervisorId', 'name email')
      .populate('internalExaminers', 'name email')
      .populate('externalExaminer', 'name email');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get evaluations for each examiner
    const supervisorEval = await Evaluation.findOne({
      groupId,
      examinerRole: 'supervisor'
    });

    const internal1Eval = await Evaluation.findOne({
      groupId,
      examinerRole: 'internal1'
    });

    const internal2Eval = await Evaluation.findOne({
      groupId,
      examinerRole: 'internal2'
    });

    const externalEval = await Evaluation.findOne({
      groupId,
      examinerRole: 'external'
    });

    res.json({
      group: {
        id: group._id,
        groupName: group.groupName
      },
      examiners: [
        {
          role: 'supervisor',
          examiner: group.supervisorId,
          marksSubmitted: !!supervisorEval?.marksSubmittedAt,
          marksSubmittedAt: supervisorEval?.marksSubmittedAt || null,
          marks: supervisorEval?.marks || null
        },
        {
          role: 'internal1',
          examiner: group.internalExaminers?.[0] || null,
          marksSubmitted: !!internal1Eval?.marksSubmittedAt,
          marksSubmittedAt: internal1Eval?.marksSubmittedAt || null,
          marks: internal1Eval?.marks || null
        },
        {
          role: 'internal2',
          examiner: group.internalExaminers?.[1] || null,
          marksSubmitted: !!internal2Eval?.marksSubmittedAt,
          marksSubmittedAt: internal2Eval?.marksSubmittedAt || null,
          marks: internal2Eval?.marks || null
        },
        {
          role: 'external',
          examiner: group.externalExaminer || null,
          marksSubmitted: !!externalEval?.marksSubmittedAt,
          marksSubmittedAt: externalEval?.marksSubmittedAt || null,
          marks: externalEval?.marks || null
        }
      ],
      finalGrade: group.finalGrade,
      allMarksSubmitted: !!(supervisorEval?.marksSubmittedAt && internal1Eval?.marksSubmittedAt && internal2Eval?.marksSubmittedAt && externalEval?.marksSubmittedAt)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get student's grade (for student dashboard)
const getMyGrade = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find group where student is a member
    const group = await Group.findOne({ members: studentId })
      .populate('members', 'name email')
      .populate('supervisorId', 'name email')
      .populate('internalExaminers', 'name email')
      .populate('externalExaminer', 'name email');

    if (!group) {
      return res.status(404).json({ error: 'You are not part of any group' });
    }

    if (group.finalGrade === null) {
      return res.status(404).json({ 
        error: 'Final grade not yet available',
        message: 'Your final grade will be displayed once all evaluations are complete and the coordinator calculates it.'
      });
    }

    // Get all evaluations for the group (marks)
    const supervisorEval = await Evaluation.findOne({
      groupId: group._id,
      examinerRole: 'supervisor',
      marksSubmittedAt: { $ne: null }
    }).populate('examinerId', 'name email');

    const internal1Eval = await Evaluation.findOne({
      groupId: group._id,
      examinerRole: 'internal1',
      marksSubmittedAt: { $ne: null }
    }).populate('examinerId', 'name email');

    const internal2Eval = await Evaluation.findOne({
      groupId: group._id,
      examinerRole: 'internal2',
      marksSubmittedAt: { $ne: null }
    }).populate('examinerId', 'name email');

    const externalEval = await Evaluation.findOne({
      groupId: group._id,
      examinerRole: 'external',
      marksSubmittedAt: { $ne: null }
    }).populate('examinerId', 'name email');

    res.json({
      message: 'Grade retrieved successfully',
      grade: {
        finalGrade: group.finalGrade,
        groupName: group.groupName,
        status: group.status,
        members: group.members,
        supervisor: group.supervisorId,
        marks: {
          supervisor: supervisorEval?.marks || null,
          internal1: internal1Eval?.marks || null,
          internal2: internal2Eval?.marks || null,
          external: externalEval?.marks || null
        },
        evaluations: {
          supervisor: supervisorEval || null,
          internal1: internal1Eval || null,
          internal2: internal2Eval || null,
          external: externalEval || null
        },
        weights: {
          supervisor: '40%',
          internal1: '15%',
          internal2: '15%',
          external: '30%'
        },
        calculationMethod: 'Weighted Average: Supervisor 40%, Internal1 15%, Internal2 15%, External 30%'
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  calculateFinalGrade,
  getAllGrades,
  getFinalGrade,
  getMyGrade,
  checkAllMarksSubmitted,
  getGroupMarksStatus
};

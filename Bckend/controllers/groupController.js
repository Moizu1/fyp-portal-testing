const Group = require('../models/Group');
const User = require('../models/User');
const { logAction, getIpAddress, getUserAgent } = require('../utils/auditLogger');

// Create a new group (Students)
const createGroup = async (req, res) => {
  try {
    const { groupName, members, supervisorId, ideaTitle, ideaDescription } = req.body;

    // Validation
    if (!groupName || !members || !supervisorId || !ideaTitle || !ideaDescription) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate max 2 members
    if (members.length > 2 || members.length === 0) {
      return res.status(400).json({ error: 'Group must have 1 or 2 members' });
    }

    // Check if group name already exists
    const existingGroup = await Group.findOne({ groupName });
    if (existingGroup) {
      return res.status(400).json({ error: 'Group name already exists' });
    }

    // Verify all members are students
    const memberUsers = await User.find({ _id: { $in: members }, role: 'student', active: true });
    if (memberUsers.length !== members.length) {
      return res.status(400).json({ error: 'All members must be active students' });
    }

    // Verify supervisor exists and has correct role
    const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor', active: true });
    if (!supervisor) {
      return res.status(400).json({ error: 'Invalid supervisor' });
    }

    // Check if any member is already in another group
    const existingMemberships = await Group.find({ members: { $in: members } });
    if (existingMemberships.length > 0) {
      return res.status(400).json({ error: 'One or more members are already in another group' });
    }

    // Create group
    const group = new Group({
      groupName,
      members,
      supervisorId,
      ideaTitle,
      ideaDescription
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('supervisorId', 'name email');

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'GROUP_CREATED',
      description: `Student created group "${groupName}" with ${members.length} member(s)`,
      metadata: {
        groupId: group._id,
        groupName,
        memberCount: members.length,
        supervisorId
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      message: 'Group created successfully',
      group: populatedGroup
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add member to group
const addMember = async (req, res) => {
  try {
    const { groupId, studentId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if group already has 2 members
    if (group.members.length >= 2) {
      return res.status(400).json({ error: 'Group already has maximum 2 members' });
    }

    // Check if student is already a member
    if (group.members.includes(studentId)) {
      return res.status(400).json({ error: 'Student is already a member' });
    }

    // Verify student exists and is active
    const student = await User.findOne({ _id: studentId, role: 'student', active: true });
    if (!student) {
      return res.status(400).json({ error: 'Invalid student' });
    }

    // Check if student is in another group
    const existingMembership = await Group.findOne({ members: studentId });
    if (existingMembership) {
      return res.status(400).json({ error: 'Student is already in another group' });
    }

    group.members.push(studentId);
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('supervisorId', 'name email');

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'GROUP_MEMBER_ADDED',
      description: `Student added member to group "${group.groupName}"`,
      metadata: {
        groupId: group._id,
        newMemberId: studentId
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      message: 'Member added successfully',
      group: populatedGroup
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Supervisor approves/rejects group idea
const supervisorReview = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { approval, notes } = req.body; // approval: APPROVED | REJECTED

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify supervisor
    if (group.supervisorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only assigned supervisor can review this group' });
    }

    if (!['APPROVED', 'REJECTED'].includes(approval)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    group.supervisorApproval = approval;
    group.supervisorNotes = notes || '';
    await group.save();

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: `SUPERVISOR_${approval}_GROUP`,
      description: `Supervisor ${approval.toLowerCase()} group "${group.groupName}"`,
      metadata: {
        groupId: group._id,
        approval,
        notes: notes || ''
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      message: `Group ${approval.toLowerCase()} by supervisor`,
      group: await Group.findById(group._id)
        .populate('members', 'name email')
        .populate('supervisorId', 'name email')
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Submit to coordinator (after supervisor approval)
const submitToCoordinator = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if supervisor has approved
    if (group.supervisorApproval !== 'APPROVED') {
      return res.status(400).json({ error: 'Supervisor approval required before submitting to coordinator' });
    }

    // Update coordinator approval status to pending (if not already submitted)
    if (group.coordinatorApproval === 'PENDING') {
      res.json({
        message: 'Group already submitted to coordinator',
        group: await Group.findById(group._id)
          .populate('members', 'name email')
          .populate('supervisorId', 'name email')
      });
    } else {
      group.coordinatorApproval = 'PENDING';
      await group.save();

      res.json({
        message: 'Group submitted to coordinator for approval',
        group: await Group.findById(group._id)
          .populate('members', 'name email')
          .populate('supervisorId', 'name email')
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Coordinator reviews group
const coordinatorReview = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { approval, notes } = req.body; // approval: APPROVED | REJECTED | DEFERRED

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!['APPROVED', 'REJECTED', 'DEFERRED'].includes(approval)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    group.coordinatorApproval = approval;
    group.coordinatorNotes = notes || '';
    await group.save();

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: `COORDINATOR_${approval}_GROUP`,
      description: `Coordinator ${approval.toLowerCase()} group "${group.groupName}"`,
      metadata: {
        groupId: group._id,
        approval,
        notes: notes || ''
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      message: `Group ${approval.toLowerCase()} by coordinator`,
      group: await Group.findById(group._id)
        .populate('members', 'name email')
        .populate('supervisorId', 'name email')
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all groups
const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', 'name email')
      .populate('supervisorId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ groups });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get group by ID
const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('members', 'name email')
      .populate('supervisorId', 'name email');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ group });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get groups by supervisor
const getGroupsBySupervisor = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    const groups = await Group.find({ supervisorId })
      .populate('members', 'name email')
      .populate('supervisorId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ groups });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get group by student
const getGroupByStudent = async (req, res) => {
  try {
    const studentId = req.user.id;

    const group = await Group.findOne({ members: studentId })
      .populate('members', 'name email')
      .populate('supervisorId', 'name email');

    // Return null group instead of 404 if student not in group yet
    res.json({ group: group || null });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update group status
const updateGroupStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status } = req.body;

    const validStatuses = ['IDEA_SUBMITTED', 'INITIAL_APPROVED', 'INTERM1_DONE', 'INTERM2_DONE', 'FINAL_PENDING', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    group.status = status;
    await group.save();

    res.json({
      message: 'Group status updated successfully',
      group: await Group.findById(group._id)
        .populate('members', 'name email')
        .populate('supervisorId', 'name email')
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update group (students can edit after rejection)
const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { supervisorId, ideaTitle, ideaDescription } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Only group members can update
    const isMember = group.members.some(m => m.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Only group members can update the group' });
    }

    // Can only update if rejected or deferred (at any stage)
    // Allow update if: supervisor rejected OR coordinator rejected/deferred
    const canUpdate = 
      group.supervisorApproval === 'REJECTED' || 
      group.coordinatorApproval === 'REJECTED' || 
      group.coordinatorApproval === 'DEFERRED';
    
    if (!canUpdate) {
      return res.status(400).json({ error: 'Group can only be updated after supervisor rejection or coordinator rejection/deferment' });
    }

    // Validate supervisor exists and is active
    if (supervisorId) {
      const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor', active: true });
      if (!supervisor) {
        return res.status(400).json({ error: 'Invalid supervisor' });
      }
      group.supervisorId = supervisorId;
    }

    if (ideaTitle) {
      group.ideaTitle = ideaTitle;
    }

    if (ideaDescription) {
      group.ideaDescription = ideaDescription;
    }

    // Reset approval states for resubmission
    group.supervisorApproval = 'PENDING';
    group.supervisorNotes = '';
    group.coordinatorApproval = 'PENDING';
    group.coordinatorNotes = '';

    await group.save();

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'GROUP_UPDATED_RESUBMITTED',
      description: `Group "${group.groupName}" updated and resubmitted after rejection/deferment`,
      metadata: {
        groupId: group._id,
        groupName: group.groupName,
        supervisorId,
        ideaTitle,
        ideaDescription
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    const updatedGroup = await Group.findById(groupId)
      .populate('members', 'name email')
      .populate('supervisorId', 'name email');

    res.json({
      message: 'Group updated and resubmitted successfully',
      group: updatedGroup
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get assigned users (supervisors and students already in groups)
const getAssignedUsers = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('supervisorId', '_id name email')
      .populate('members', '_id name email');

    const assignedSupervisorIds = groups
      .map(g => g.supervisorId?._id?.toString())
      .filter(id => id);

    const assignedStudentIds = groups.flatMap(g =>
      (g.members || []).map(m => m._id?.toString())
    ).filter(id => id);

    res.json({
      assignedSupervisorIds,
      assignedStudentIds
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Assign examiners to group (Coordinator only)
const assignExaminers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { internalExaminer1, internalExaminer2, externalExaminer } = req.body;

    // Validation
    if (!internalExaminer1 || !internalExaminer2 || !externalExaminer) {
      return res.status(400).json({ error: 'All examiners are required: 2 internal and 1 external' });
    }

    // Check that internal examiners are not duplicated
    if (internalExaminer1 === internalExaminer2) {
      return res.status(400).json({ error: 'Internal examiners must be different' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify internal examiners exist and have correct role
    const internal1 = await User.findOne({ _id: internalExaminer1, role: 'internalexaminer', active: true });
    const internal2 = await User.findOne({ _id: internalExaminer2, role: 'internalexaminer', active: true });
    
    if (!internal1 || !internal2) {
      return res.status(400).json({ error: 'Invalid internal examiner(s)' });
    }

    // Verify external examiner exists and has correct role
    const external = await User.findOne({ _id: externalExaminer, role: 'externalexaminer', active: true });
    if (!external) {
      return res.status(400).json({ error: 'Invalid external examiner' });
    }

    // Update group with examiners
    group.internalExaminers = [internalExaminer1, internalExaminer2];
    group.externalExaminer = externalExaminer;
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('members', 'name email')
      .populate('supervisorId', 'name email')
      .populate('internalExaminers', 'name email')
      .populate('externalExaminer', 'name email');

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'EXAMINERS_ASSIGNED',
      description: `Coordinator assigned examiners to group "${group.groupName}"`,
      metadata: {
        groupId: group._id,
        groupName: group.groupName,
        internalExaminers: [internalExaminer1, internalExaminer2],
        externalExaminer
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      message: 'Examiners assigned successfully',
      group: updatedGroup
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createGroup,
  addMember,
  supervisorReview,
  submitToCoordinator,
  coordinatorReview,
  getAllGroups,
  getGroupById,
  getGroupsBySupervisor,
  getGroupByStudent,
  updateGroupStatus,
  updateGroup,
  getAssignedUsers,
  assignExaminers
};

const Log = require('../models/Log');
const Group = require('../models/Group');
const User = require('../models/User');
const { logAction, getIpAddress, getUserAgent } = require('../utils/auditLogger');

// Submit log (Students)
const submitLog = async (req, res) => {
  try {
    console.log('Received log submission request:', {
      body: req.body,
      userId: req.user?.id
    });

    const { groupId, logNumber, description, signature } = req.body;
    const studentId = req.user.id;

    // Validation
    if (!groupId || !logNumber || !description) {
      console.log('Validation failed:', { groupId, logNumber, description });
      return res.status(400).json({ error: 'Group ID, log number, and description are required' });
    }

    // Validate log number (1-24)
    if (logNumber < 1 || logNumber > 24) {
      return res.status(400).json({ error: 'Log number must be between 1 and 24' });
    }

    // Verify group exists
    const group = await Group.findById(groupId).populate('supervisorId');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if project is approved by BOTH supervisor AND coordinator
    if (group.supervisorApproval !== 'APPROVED') {
      return res.status(403).json({ error: 'Project must be approved by supervisor before submitting logs' });
    }
    if (group.coordinatorApproval !== 'APPROVED') {
      return res.status(403).json({ error: 'Project must be approved by coordinator before submitting logs' });
    }

    // Verify student is a member of the group
    const isMember = group.members.some(memberId => memberId.toString() === studentId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Check if log with this number already exists for this student
    const existingLog = await Log.findOne({ groupId, studentId, logNumber });
    if (existingLog) {
      return res.status(400).json({ error: `Log ${logNumber} already submitted` });
    }

    // Determine type based on log number
    const type = logNumber <= 8 ? 'LOG1-LOG8' : 'LOG9-LOG24';

    // Create log
    const log = new Log({
      groupId,
      studentId,
      supervisorId: group.supervisorId._id,
      logNumber,
      type,
      description,
      signature: signature || false,
      supervisorApproval: 'PENDING'
    });

    await log.save();

    const populatedLog = await Log.findById(log._id)
      .populate('groupId')
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email');

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'LOG_SUBMITTED',
      description: `Student submitted Log #${logNumber}`,
      metadata: {
        logId: log._id,
        groupId,
        logNumber
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      message: 'Log submitted successfully',
      log: populatedLog
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Supervisor approves/rejects log
const approveLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const { status, approvalNotes } = req.body; // status: 'APPROVED' or 'REJECTED'
    const supervisorId = req.user.id;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (APPROVED or REJECTED) is required' });
    }

    const log = await Log.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Verify supervisor
    if (log.supervisorId.toString() !== supervisorId) {
      return res.status(403).json({ error: 'Only the assigned supervisor can approve this log' });
    }

    if (log.supervisorApproval !== 'PENDING') {
      return res.status(400).json({ error: 'Log has already been reviewed' });
    }

    log.supervisorApproval = status;
    log.approvalNotes = approvalNotes || '';
    log.approved = status === 'APPROVED';
    log.signature = status === 'APPROVED';
    if (status === 'APPROVED') {
      log.approvedAt = new Date();
    }
    await log.save();

    const populatedLog = await Log.findById(log._id)
      .populate('groupId')
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email');

    // Audit log
    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: status === 'APPROVED' ? 'LOG_APPROVED' : 'LOG_REJECTED',
      description: `Supervisor ${status.toLowerCase()} Log #${log.logNumber}`,
      metadata: {
        logId: log._id,
        groupId: log.groupId._id,
        logNumber: log.logNumber,
        studentId: log.studentId._id,
        approvalNotes
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      message: `Log ${status.toLowerCase()} successfully`,
      log: populatedLog
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get logs by group
const getLogsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const logs = await Log.find({ groupId })
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email')
      .sort({ logNumber: 1 });

    res.json({ logs });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get logs by student
const getLogsByStudent = async (req, res) => {
  try {
    const studentId = req.user.id;

    const logs = await Log.find({ studentId })
      .populate('groupId')
      .populate('supervisorId', 'name email')
      .sort({ logNumber: 1 });

    res.json({ logs });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get logs for supervisor
const getLogsForSupervisor = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    const logs = await Log.find({ supervisorId })
      .populate('groupId')
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ logs });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all logs (Admin, Coordinator)
const getAllLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate({
        path: 'groupId',
        populate: {
          path: 'members supervisorId',
          select: 'name email'
        }
      })
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ logs });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update log
const updateLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const { description } = req.body;
    const studentId = req.user.id;

    const log = await Log.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Verify student owns the log
    if (log.studentId.toString() !== studentId) {
      return res.status(403).json({ error: 'You can only update your own logs' });
    }

    // Cannot update approved logs
    if (log.approved) {
      return res.status(400).json({ error: 'Cannot update approved logs' });
    }

    if (description) {
      log.description = description;
    }

    await log.save();

    const populatedLog = await Log.findById(log._id)
      .populate('groupId')
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email');

    res.json({
      message: 'Log updated successfully',
      log: populatedLog
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete log
const deleteLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const studentId = req.user.id;

    const log = await Log.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Verify student owns the log or is admin/coordinator
    const isOwner = log.studentId.toString() === studentId;
    const isAuthorized = isOwner || ['admin', 'coordinator'].includes(req.user.role);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Cannot delete approved logs
    if (log.approved) {
      return res.status(400).json({ error: 'Cannot delete approved logs' });
    }

    await Log.findByIdAndDelete(logId);

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get approved logs by group (Coordinator)
const getApprovedLogsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const logs = await Log.find({ 
      groupId, 
      supervisorApproval: 'APPROVED' 
    })
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email')
      .sort({ logNumber: 1 });

    res.json({ logs });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  submitLog,
  approveLog,
  getLogsByGroup,
  getLogsByStudent,
  getLogsForSupervisor,
  getAllLogs,
  updateLog,
  deleteLog,
  getApprovedLogsByGroup
};

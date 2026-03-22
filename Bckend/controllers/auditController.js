const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// Get all audit logs with filtering and pagination
const getAllAuditLogs = async (req, res) => {
  try {
    const {
      userId,
      userRole,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};

    if (userId) {
      filter.userId = userId;
    }

    if (userRole) {
      filter.userRole = userRole;
    }

    if (action) {
      // Support partial match for action
      filter.action = { $regex: action, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query with population
    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await AuditLog.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      auditLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: totalCount,
        recordsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get audit log by ID
const getAuditLogById = async (req, res) => {
  try {
    const { logId } = req.params;

    const auditLog = await AuditLog.findById(logId)
      .populate('userId', 'name email role active');

    if (!auditLog) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({ auditLog });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get audit logs for a specific user
const getAuditLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const auditLogs = await AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await AuditLog.countDocuments({ userId });
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      auditLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: totalCount,
        recordsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get audit statistics
const getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.timestamp.$lte = new Date(endDate);
      }
    }

    // Get statistics
    const [
      totalLogs,
      actionStats,
      roleStats,
      recentActivity
    ] = await Promise.all([
      // Total count
      AuditLog.countDocuments(dateFilter),

      // Count by action type
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Count by user role
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$userRole', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Recent activity (last 24 hours)
      AuditLog.find({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(10)
    ]);

    res.json({
      totalLogs,
      actionBreakdown: actionStats.map(stat => ({
        action: stat._id,
        count: stat.count
      })),
      roleBreakdown: roleStats.map(stat => ({
        role: stat._id,
        count: stat.count
      })),
      recentActivity
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get unique action types
const getActionTypes = async (req, res) => {
  try {
    const actionTypes = await AuditLog.distinct('action');
    res.json({ actionTypes: actionTypes.sort() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete old audit logs (cleanup - Admin only)
const deleteOldLogs = async (req, res) => {
  try {
    const { olderThanDays } = req.body;

    if (!olderThanDays || olderThanDays < 30) {
      return res.status(400).json({ error: 'Must specify at least 30 days' });
    }

    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      message: `Deleted ${result.deletedCount} audit logs older than ${olderThanDays} days`,
      deletedCount: result.deletedCount,
      cutoffDate
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Export audit logs (CSV format)
const exportAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .lean();

    // Convert to CSV
    const csvHeaders = 'Timestamp,User,Email,Role,Action,Description,Metadata\n';
    const csvRows = logs.map(log => {
      const timestamp = log.timestamp.toISOString();
      const userName = log.userId?.name || 'Unknown';
      const userEmail = log.userId?.email || 'N/A';
      const userRole = log.userRole;
      const action = log.action;
      const description = log.description.replace(/"/g, '""'); // Escape quotes
      const metadata = JSON.stringify(log.metadata || {}).replace(/"/g, '""');
      
      return `"${timestamp}","${userName}","${userEmail}","${userRole}","${action}","${description}","${metadata}"`;
    }).join('\n');

    const csv = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAllAuditLogs,
  getAuditLogById,
  getAuditLogsByUser,
  getAuditStats,
  getActionTypes,
  deleteOldLogs,
  exportAuditLogs
};

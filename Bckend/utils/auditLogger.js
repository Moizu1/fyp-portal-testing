const AuditLog = require('../models/AuditLog');

/**
 * Log an action to the audit trail
 * @param {Object} params - Logging parameters
 * @param {String} params.userId - ID of user performing action
 * @param {String} params.userRole - Role of user
 * @param {String} params.action - Action type (e.g., "GROUP_CREATED")
 * @param {String} params.description - Detailed description
 * @param {Object} params.metadata - Additional data (optional)
 * @param {String} params.ipAddress - User's IP address (optional)
 * @param {String} params.userAgent - User's browser/client info (optional)
 */
const logAction = async ({ userId, userRole, action, description, metadata = {}, ipAddress = null, userAgent = null }) => {
  try {
    // Validate required fields
    if (!userId || !userRole || !action || !description) {
      console.error('Audit log missing required fields:', { userId, userRole, action, description });
      return null;
    }

    // Create audit log entry
    const auditLog = new AuditLog({
      userId,
      userRole,
      action,
      description,
      metadata: metadata || {},
      timestamp: new Date(),
      ipAddress,
      userAgent
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    // Don't throw error - audit logging should not break application flow
    console.error('Failed to create audit log:', error.message);
    return null;
  }
};

/**
 * Extract IP address from request
 */
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         null;
};

/**
 * Extract user agent from request
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || null;
};

/**
 * Middleware to automatically log API requests
 * Use this on routes that need automatic logging
 */
const auditMiddleware = (action, getDescription) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Only log on successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const description = typeof getDescription === 'function' 
          ? getDescription(req, data) 
          : `User performed ${action}`;

        logAction({
          userId: req.user.id,
          userRole: req.user.role,
          action,
          description,
          metadata: {
            endpoint: req.originalUrl,
            method: req.method,
            params: req.params,
            statusCode: res.statusCode
          },
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req)
        });
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  logAction,
  getIpAddress,
  getUserAgent,
  auditMiddleware
};

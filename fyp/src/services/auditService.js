import api from '../utils/api';

const auditService = {
  // Get all audit logs (admin only)
  getAllAuditLogs: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/audit-logs?${queryString}`);
      return response.data.auditLogs || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  },

  // Get audit log by ID
  getAuditLogById: async (logId) => {
    const response = await api.get(`/audit-logs/${logId}`);
    return response.data;
  },

  // Get audit logs by user
  getAuditLogsByUser: async (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/audit-logs/user/${userId}?${queryString}`);
    return response.data;
  },

  // Get audit statistics
  getAuditStatistics: async () => {
    const response = await api.get('/audit-logs/stats');
    return response.data;
  },

  // Get action types
  getActionTypes: async () => {
    const response = await api.get('/audit-logs/actions');
    return response.data;
  },

  // Export audit logs (CSV)
  exportAuditLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/audit-logs/export?${queryString}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Delete old logs
  deleteOldLogs: async (daysToKeep) => {
    const response = await api.delete('/audit-logs/cleanup', { data: { daysToKeep } });
    return response.data;
  },
};

export default auditService;

import api from '../utils/api';

const logService = {
  // Submit log (student)
  submitLog: async (logData) => {
    const response = await api.post('/logs/submit', logData);
    return response.data;
  },

  // Get logs by group
  getLogsByGroup: async (groupId) => {
    const response = await api.get(`/logs/group/${groupId}`);
    return response.data;
  },

  // Get logs for supervisor
  getSupervisorLogs: async () => {
    try {
      const response = await api.get('/logs/supervisor/my-logs');
      return response.data;
    } catch (error) {
      console.error('Error fetching supervisor logs:', error);
      return { logs: [] };
    }
  },

  // Approve/Reject log (supervisor)
  approveLog: async (logId, status, approvalNotes) => {
    const response = await api.put(`/logs/${logId}/approve`, { status, approvalNotes });
    return response.data;
  },

  // Get student's logs
  getMyLogs: async () => {
    try {
      const response = await api.get('/logs/student/my-logs');
      return response.data;
    } catch (error) {
      console.error('Error fetching my logs:', error);
      return { logs: [] };
    }
  },

  // Get approved logs by group (coordinator)
  getApprovedLogsByGroup: async (groupId) => {
    try {
      const response = await api.get(`/logs/group/${groupId}/approved`);
      return response.data;
    } catch (error) {
      console.error('Error fetching approved logs:', error);
      return { logs: [] };
    }
  },

  // Get all logs (admin, coordinator)
  getAllLogs: async () => {
    try {
      const response = await api.get('/logs');
      return response.data.logs || [];
    } catch (error) {
      console.error('Error fetching all logs:', error);
      return [];
    }
  },

  // Update log (student)
  updateLog: async (logId, logData) => {
    const response = await api.put(`/logs/${logId}`, logData);
    return response.data;
  },

  // Get log by ID
  getLogById: async (logId) => {
    const response = await api.get(`/logs/${logId}`);
    return response.data;
  },

  // Delete log
  deleteLog: async (logId) => {
    const response = await api.delete(`/logs/${logId}`);
    return response.data;
  },
};

export default logService;

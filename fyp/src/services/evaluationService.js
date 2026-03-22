import api from '../utils/api';

const evaluationService = {
  // Submit remarks (examiners)
  submitRemarks: async (remarksData) => {
    const response = await api.post('/evaluations/remarks/submit', remarksData);
    return response.data;
  },

  // Submit marks (all examiners - supervisor, internal, external)
  submitMarks: async (marksData) => {
    const response = await api.post('/evaluations/marks/submit', marksData);
    return response.data;
  },

  // Check if remarks submitted for presentation
  checkRemarkStatus: async (presentationId) => {
    const response = await api.get(`/evaluations/remarks/check/${presentationId}`);
    return response.data;
  },

  // Check if marks submitted for group
  checkMarksStatus: async (groupId) => {
    const response = await api.get(`/evaluations/marks/check/${groupId}`);
    return response.data;
  },

  // Get my remarks submissions
  getMyRemarks: async () => {
    const response = await api.get('/evaluations/remarks/my');
    return response.data;
  },

  // Get my marks submissions
  getMyMarks: async () => {
    const response = await api.get('/evaluations/marks/my');
    return response.data;
  },

  // Get all evaluations for a group (coordinator, admin)
  getGroupEvaluations: async (groupId) => {
    const response = await api.get(`/evaluations/group/${groupId}`);
    return response.data;
  },

  // Get remarks for a presentation
  getPresentationRemarks: async (presentationId) => {
    const response = await api.get(`/evaluations/presentation/${presentationId}/remarks`);
    return response.data;
  },

  // Get all evaluations (admin, coordinator)
  getAllEvaluations: async () => {
    const response = await api.get('/evaluations');
    return response.data;
  },

  // Legacy: Get my evaluations (for backward compatibility)
  getMyEvaluations: async () => {
    const response = await api.get('/evaluations/marks/my');
    return response.data;
  }
};

export default evaluationService;


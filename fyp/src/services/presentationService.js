import api from '../utils/api';

const presentationService = {
  // Create presentation (coordinator)
  createPresentation: async (presentationData) => {
    const response = await api.post('/presentations/create', presentationData);
    return response.data;
  },

  // Assign examiner (coordinator)
  assignExaminer: async (presentationId, examinerId, examinerType) => {
    const response = await api.put(`/presentations/${presentationId}/assign-examiner`, {
      examinerId,
      examinerType
    });
    return response.data;
  },

  // Get all presentations (coordinator, admin)
  getAllPresentations: async () => {
    try {
      const response = await api.get('/presentations');
      return response.data.presentations || [];
    } catch (error) {
      console.error('Error fetching all presentations:', error);
      return [];
    }
  },

  // Get presentation by ID
  getPresentationById: async (presentationId) => {
    const response = await api.get(`/presentations/${presentationId}`);
    return response.data;
  },

  // Get presentations by group
  getPresentationsByGroup: async (groupId) => {
    try {
      const response = await api.get(`/presentations/group/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching presentations by group:', error);
      return { presentations: [] };
    }
  },

  // Get presentations for examiner
  getMyPresentations: async () => {
    const response = await api.get('/presentations/examiner/my-presentations');
    return response.data;
  },

  // Update presentation status (coordinator)
  updatePresentationStatus: async (presentationId, status) => {
    const response = await api.put(`/presentations/${presentationId}/status`, { status });
    return response.data;
  },

  // Update presentation result (coordinator)
  updatePresentationResult: async (presentationId, result) => {
    const response = await api.put(`/presentations/${presentationId}/result`, { result });
    return response.data;
  },

  // Submit final marks (supervisor)
  submitFinalMarks: async (groupId, data) => {
    const response = await api.post('/presentations/final-marks', { groupId, ...data });
    return response.data;
  },
};

export default presentationService;

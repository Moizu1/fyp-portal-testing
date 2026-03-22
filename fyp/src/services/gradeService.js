import api from '../utils/api';

const gradeService = {
  // Get all final grades (coordinator)
  getAllGrades: async () => {
    const response = await api.get('/grades');
    return response.data;
  },

  // Get my grade (student)
  getMyGrade: async () => {
    const response = await api.get('/grades/my-grade');
    return response.data;
  },

  // Calculate final grade (coordinator only - after all marks submitted)
  calculateFinalGrade: async (groupId) => {
    const response = await api.post(`/grades/calculate/${groupId}`);
    return response.data;
  },

  // Get final grade by group
  getGroupGrade: async (groupId) => {
    const response = await api.get(`/grades/group/${groupId}`);
    return response.data;
  },

  // Check if all marks are submitted (coordinator)
  checkAllMarksSubmitted: async (groupId) => {
    const response = await api.get(`/grades/check-marks/${groupId}`);
    return response.data;
  },

  // Get marks submission status for group (coordinator)
  getGroupMarksStatus: async (groupId) => {
    const response = await api.get(`/grades/status/${groupId}`);
    return response.data;
  }
};

export default gradeService;

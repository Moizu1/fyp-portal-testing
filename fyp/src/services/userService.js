import api from '../utils/api';

const userService = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Update user (admin only)
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Register new user (admin only)
  registerUser: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Create new user (alias for registerUser)
  createUser: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get supervisors (for students creating groups)
  getSupervisors: async () => {
    try {
      const response = await api.get('/users/supervisors');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      return [];
    }
  },

  // Get students (for adding group members)
  getStudents: async () => {
    try {
      const response = await api.get('/users/students');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  },
};

export default userService;

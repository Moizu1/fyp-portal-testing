import api from '../utils/api';

const groupService = {
  // Create group (student)
  createGroup: async (groupData) => {
    const response = await api.post('/groups/create', groupData);
    return response.data;
  },

  // Add member to group (student)
  addMember: async (groupId, studentId) => {
    const response = await api.post('/groups/add-member', { groupId, studentId });
    return response.data;
  },

  // Supervisor review
  supervisorReview: async (groupId, approval, notes) => {
    const response = await api.put(`/groups/${groupId}/supervisor-review`, { approval, notes });
    return response.data;
  },

  // Submit to coordinator (student)
  submitToCoordinator: async (groupId) => {
    const response = await api.put(`/groups/${groupId}/submit-to-coordinator`);
    return response.data;
  },

  // Coordinator review
  coordinatorReview: async (groupId, approval, notes) => {
    const response = await api.put(`/groups/${groupId}/coordinator-review`, { approval, notes });
    return response.data;
  },

  // Get all groups (admin, coordinator)
  getAllGroups: async () => {
    try {
      const response = await api.get('/groups');
      return response.data.groups || [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  },

  // Get group by ID
  getGroupById: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  // Get groups by supervisor
  getMySupervisedGroups: async () => {
    try {
      const response = await api.get('/groups/supervisor/my-groups');
      return response.data;
    } catch (error) {
      console.error('Error fetching supervised groups:', error);
      return { groups: [] };
    }
  },

  // Get student's group
  getMyGroup: async () => {
    try {
      const response = await api.get('/groups/student/my-group');
      return response.data;
    } catch (error) {
      console.error('Error fetching my group:', error);
      return { group: null };
    }
  },

  // Update group status (coordinator)
  updateGroupStatus: async (groupId, status) => {
    const response = await api.put(`/groups/${groupId}/status`, { status });
    return response.data;
  },
  // Update group (student - after rejection)
  updateGroup: async (groupId, updateData) => {
    const response = await api.put(`/groups/${groupId}/update`, updateData);
    return response.data;
  },

  // Get assigned users (supervisors and students already in groups)
  getAssignedUsers: async () => {
    try {
      const response = await api.get('/groups/assigned-users');
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      return { assignedSupervisorIds: [], assignedStudentIds: [] };
    }
  },

  // Assign examiners to group (coordinator)
  assignExaminers: async (groupId, examinerData) => {
    const response = await api.put(`/groups/${groupId}/assign-examiners`, examinerData);
    return response.data;
  },
};

export default groupService;

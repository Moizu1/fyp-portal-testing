import api from '../utils/api';

const documentService = {

  // ===========================
  // Upload document (Student)
  // ===========================
  uploadDocument: async (formData) => {
    const response = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },


  // ===========================
  // Get documents by group
  // ===========================
  getDocumentsByGroup: async (groupId) => {
    try {
      const response = await api.get(`/documents/group/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      return { documents: [] };
    }
  },


  // ===========================
  // Get a single document
  // ===========================
  getDocumentById: async (documentId) => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },


  // ===========================
  // Admin / Coordinator: Get all documents
  // ===========================
  getAllDocuments: async () => {
    try {
      const response = await api.get('/documents');
      return response.data.documents || [];
    } catch (error) {
      console.error('Error fetching all documents:', error);
      return [];
    }
  },


  // ===========================
  // Examiner: Get assigned documents
  // ===========================
  getExaminerDocuments: async () => {
    try {
      const response = await api.get('/documents/examiner/my-documents');
      return response.data.documents || [];
    } catch (error) {
      console.error('Error fetching examiner documents:', error);
      return [];
    }
  },


  // ===========================
  // Delete document
  // ===========================
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },

};

export default documentService;

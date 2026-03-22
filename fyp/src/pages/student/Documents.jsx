import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Button from '../../components/Button';
import Input from '../../components/Input';
import documentService from '../../services/documentService';
import groupService from '../../services/groupService';

const StudentDocuments = () => {
  const [documents, setDocuments] = useState({ SDS: null, SRS: null, FINAL_DOCUMENT: null });
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [uploading, setUploading] = useState({ SDS: false, SRS: false, FINAL_DOCUMENT: false });
  const [canUpload, setCanUpload] = useState(false);

  const handleDownload = (fileUrl) => {
  window.open(fileUrl, "_blank", "noopener,noreferrer");
};


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const groupData = await groupService.getMyGroup();
      if (groupData.group) {
        setGroup(groupData.group);
        
        // Check if project is approved
        const isApproved = groupData.group.supervisorApproval === 'APPROVED' && 
                          groupData.group.coordinatorApproval === 'APPROVED';
        setCanUpload(isApproved);
        
        const docsData = await documentService.getDocumentsByGroup(groupData.group._id);
        const docs = docsData.documents || [];
        
        // Organize documents by type - backend uses lowercase
        const organized = {
          SDS: docs.find(d => d.type === 'sds') || null,
          SRS: docs.find(d => d.type === 'srs') || null,
          FINAL_DOCUMENT: docs.find(d => d.type === 'final') || null
        };
        setDocuments(organized);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (type, file) => {
    if (!file) {
      console.warn('No file selected');
      return;
    }

    if (!group) {
      alert('You must be in a group to upload documents');
      return;
    }

    if (!canUpload) {
      alert('Project must be approved before uploading documents');
      return;
    }

    

    // Validate file
    if (file.size === 0) {
      alert('Error: File is empty (0 bytes)');
      return;
    }

    if (!file.type || file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    
    try {
      setUploading({ ...uploading, [type]: true });
      
      // Map frontend type to backend type (backend uses lowercase)
      const backendType = type === 'FINAL_DOCUMENT' ? 'final' : type.toLowerCase();
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupId', group._id);
      formData.append('type', backendType);
      const result = await documentService.uploadDocument(formData);
      console.log('✅ Upload successful:', result);
      
      await loadData();
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      alert(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading({ ...uploading, [type]: false });
    }
  };

  const renderDocumentCard = (type, title) => {
    const doc = documents[type];
    const isUploading = uploading[type];
    
    return (
      <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        
        {doc ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              <strong>Uploaded:</strong> {new Date(doc.uploadedAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Uploaded By:</strong> {doc.uploadedBy?.name || 'Unknown'}
            </p>
            <button
  onClick={() => handleDownload(doc.fileUrl)}
  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
>
  Download Document
</button>

            {canUpload && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Replace with new version:</p>
                <Input 
                  type="file"
                  accept="application/pdf"
                  onChange={(file) => handleUpload(type, file)}
                  disabled={isUploading}
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            {canUpload ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">No document uploaded yet</p>
                <Input 
                  type="file"
                  accept="application/pdf"
                  onChange={(file) => handleUpload(type, file)}
                  disabled={isUploading}
                />
                {isUploading && (
                  <p className="text-sm text-blue-600">Uploading...</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Project must be approved before uploading documents
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Project Documents</h2>
          <p className="text-gray-600 mt-1">Upload SDS, SRS, and Final Report</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : !group ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">You must be part of a group to upload documents</p>
          </div>
        ) : !canUpload ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              <strong>Project Not Approved:</strong> Your project must be approved by both supervisor and coordinator before you can upload documents.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Supervisor Status: <strong>{group.supervisorApproval}</strong> | 
              Coordinator Status: <strong>{group.coordinatorApproval}</strong>
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderDocumentCard('SDS', 'Software Design Specification (SDS)')}
          {renderDocumentCard('SRS', 'Software Requirements Specification (SRS)')}
          {renderDocumentCard('FINAL_DOCUMENT', 'Final Report')}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDocuments;

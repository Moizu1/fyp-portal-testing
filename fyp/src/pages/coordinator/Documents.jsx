import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Button from '../../components/Button';
import documentService from '../../services/documentService';
import groupService from '../../services/groupService';

const CoordinatorDocuments = () => {
  const { groupId } = useParams();
  const [documents, setDocuments] = useState({ SDS: null, SRS: null, FINAL_DOCUMENT: null });
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupData, docsResponse] = await Promise.all([
        groupService.getGroupById(groupId),
        documentService.getDocumentsByGroup(groupId)
      ]);

      setGroup(groupData);

      const docsMap = { SDS: null, SRS: null, FINAL_DOCUMENT: null };
      const docsData = docsResponse.documents || [];
      // Backend uses lowercase types: 'sds', 'srs', 'final'
      docsData.forEach(doc => {
        if (doc.type === 'sds') docsMap.SDS = doc;
        else if (doc.type === 'srs') docsMap.SRS = doc;
        else if (doc.type === 'final') docsMap.FINAL_DOCUMENT = doc;
      });
      setDocuments(docsMap);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDocumentCard = (title, type, document) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            document ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {document ? 'Uploaded' : 'Pending'}
          </span>
        </div>
        
        {document ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-gray-600">Uploaded by:</span>
                <span className="ml-2 font-medium text-gray-900">{document.uploadedBy?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {new Date(document.uploadedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            
            <Button
              variant="primary"
              onClick={() => handleDownload(document.fileUrl, `${group?.groupName || 'document'}_${type}.pdf`)}
              className="w-full flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Document
            </Button>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No document uploaded</p>
            <p className="text-gray-400 text-sm mt-1">Student has not submitted this document yet</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role="coordinator">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading documents...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="coordinator">
      <div className="space-y-6">
        <div className="rounded-lg shadow-sm border border-gray-200 p-6 text-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Group Documents</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderDocumentCard('Software Design Specification (SDS)', 'SDS', documents.SDS)}
          {renderDocumentCard('Software Requirements Specification (SRS)', 'SRS', documents.SRS)}
          {renderDocumentCard('Final Report', 'FINAL_DOCUMENT', documents.FINAL_DOCUMENT)}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorDocuments;

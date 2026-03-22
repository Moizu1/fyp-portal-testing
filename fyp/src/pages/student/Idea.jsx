import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import groupService from '../../services/groupService';

const StudentIdea = () => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const groupData = await groupService.getMyGroup();
      setGroup(groupData.group || null);
    } catch (error) {
      console.error('Error loading idea:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Project Idea</h2>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : !group ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">You must create a group first to view project idea</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">{group.ideaTitle}</h3>
            <p className="text-gray-600 mb-4">{group.ideaDescription}</p>
            <div className="flex items-center space-x-4 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                group.supervisorApproval === 'APPROVED' ? 'bg-green-100 text-green-800' :
                group.supervisorApproval === 'REJECTED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {group.supervisorApproval}
              </span>
              <span className="text-sm text-gray-500">by Supervisor {group.supervisorId?.name || 'Unknown'}</span>
            </div>
            {group.supervisorNotes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700"><strong>Supervisor Remarks:</strong> {group.supervisorNotes}</p>
              </div>
            )}
            {group.coordinatorApproval && (
              <>
                <div className="flex items-center space-x-4 mt-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    group.coordinatorApproval === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    group.coordinatorApproval === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    group.coordinatorApproval === 'DEFERRED' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    Coordinator: {group.coordinatorApproval}
                  </span>
                </div>
                {group.coordinatorNotes && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700"><strong>Coordinator Remarks:</strong> {group.coordinatorNotes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentIdea;

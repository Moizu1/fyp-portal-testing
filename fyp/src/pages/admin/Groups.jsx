import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import groupService from '../../services/groupService';

const AdminGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        const data = await groupService.getAllGroups();
        const groups = data.groups || data || [];
        setGroups(groups);
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  const columns = [
    { header: 'Group Name', accessor: 'groupName' },
    { 
      header: 'Supervisor', 
      render: (row) => row.supervisorId?.name || 'N/A'
    },
    { 
      header: 'Members', 
      render: (row) => (
        <div className="text-sm">
          {row.members?.map((m, idx) => (
            <div key={idx}>{m.name}</div>
          ))}
        </div>
      )
    },
    { header: 'Idea', accessor: 'ideaTitle' },
    { 
      header: 'Sup. Status', 
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.supervisorApproval === 'APPROVED' ? 'bg-green-100 text-green-800' :
          row.supervisorApproval === 'REJECTED' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.supervisorApproval}
        </span>
      )
    },
    { 
      header: 'Coord. Status', 
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.coordinatorApproval === 'APPROVED' ? 'bg-green-100 text-green-800' :
          row.coordinatorApproval === 'REJECTED' ? 'bg-red-100 text-red-800' :
          row.coordinatorApproval === 'DEFERRED' ? 'bg-purple-100 text-purple-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.coordinatorApproval}
        </span>
      )
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All Groups</h2>
          <p className="text-gray-600 mt-1">View and manage all FYP groups</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading groups...</div>
          ) : (
            <Table columns={columns} data={groups} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminGroups;

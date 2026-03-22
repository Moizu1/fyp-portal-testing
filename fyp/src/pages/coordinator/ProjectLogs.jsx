import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Button from '../../components/Button';
import logService from '../../services/logService';
import groupService from '../../services/groupService';

const CoordinatorProjectLogs = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, groupData] = await Promise.all([
        logService.getApprovedLogsByGroup(groupId),
        groupService.getGroupById(groupId)
      ]);
      
      setLogs(logsData.logs || []);
      setGroup(groupData.group);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Log No', accessor: 'logNumber' },
    { 
      header: 'Student Name',
      render: (row) => row.studentId?.name || 'N/A'
    },
    { 
      header: 'Description',
      render: (row) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-700">{row.description}</p>
        </div>
      )
    },
    { 
      header: 'Date Approved',
      render: (row) => new Date(row.approvedAt).toLocaleDateString()
    },
  ];

  return (
    <DashboardLayout role="coordinator">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="secondary" onClick={() => navigate('/coordinator/groups')}>
              ← Back to Groups
            </Button>
            <h2 className="text-2xl font-bold text-gray-800 mt-4">
              {group ? `Approved Logs - ${group.groupName}` : 'Project Logs'}
            </h2>
            <p className="text-gray-600 mt-1">View approved logs from students</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No approved logs yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <Table columns={columns} data={logs} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorProjectLogs;

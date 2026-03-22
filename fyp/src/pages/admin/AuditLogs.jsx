import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import auditService from '../../services/auditService';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      const data = await auditService.getAllAuditLogs();
      setLogs(data);
      setLoading(false);
    };
    loadLogs();
  }, []);

  const columns = [
    { 
      header: 'ID', 
      render: (row) => (
        <span className="text-xs text-gray-600 font-mono">
          {row._id?.slice(-8) || 'N/A'}
        </span>
      )
    },
    { 
      header: 'User', 
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.userId?.name || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{row.userId?.email || ''}</p>
        </div>
      )
    },
    { 
      header: 'Action', 
      render: (row) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {row.action || 'N/A'}
        </span>
      )
    },
    { 
      header: 'Description', 
      render: (row) => (
        <span className="text-sm text-gray-700">{row.description || 'No details'}</span>
      )
    },
    { 
      header: 'Role', 
      render: (row) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          {row.userRole || 'N/A'}
        </span>
      )
    },
    { 
      header: 'Timestamp', 
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : 'N/A'}
        </span>
      )
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Audit Logs</h2>
          <p className="text-gray-600 mt-1">View system activity and user actions</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading logs...</div>
          ) : (
            <Table columns={columns} data={logs} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAuditLogs;

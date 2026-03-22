import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import logService from '../../services/logService';

const SupervisorLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await logService.getSupervisorLogs();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      await logService.approveLog(selectedLog._id, 'APPROVED', remarks);
      setIsModalOpen(false);
      setRemarks('');
      setSelectedLog(null);
      loadData();
      alert('Log approved successfully!');
    } catch (error) {
      console.error('Error approving log:', error);
      alert(error.response?.data?.error || 'Failed to approve log');
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      alert('Please provide rejection reason');
      return;
    }
    try {
      await logService.approveLog(selectedLog._id, 'REJECTED', remarks);
      setIsModalOpen(false);
      setRemarks('');
      setSelectedLog(null);
      loadData();
      alert('Log rejected');
    } catch (error) {
      console.error('Error rejecting log:', error);
      alert(error.response?.data?.error || 'Failed to reject log');
    }
  };

  const columns = [
    { 
      header: 'Group', 
      render: (row) => row.groupId?.groupName || 'N/A'
    },
    { 
      header: 'Student',
      render: (row) => row.studentId?.name || 'N/A'
    },
    { header: 'Log #', accessor: 'logNumber' },
    { header: 'Type', accessor: 'type' },
    { 
      header: 'Date', 
      render: (row) => new Date(row.submittedAt).toLocaleDateString()
    },
    { 
      header: 'Status', 
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
      header: 'Actions',
      render: (row) => row.supervisorApproval === 'PENDING' ? (
        <Button size="sm" onClick={() => { setSelectedLog(row); setIsModalOpen(true); }}>
          Review
        </Button>
      ) : <span className="text-gray-500">-</span>
    },
  ];

  return (
    <DashboardLayout role="supervisor">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Student Logs</h2>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <Table columns={columns} data={logs} />
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Review Log">
        <form onSubmit={handleApprove}>
          <div className="mb-4 space-y-2">
            <p><strong>Group:</strong> {selectedLog?.groupId?.groupName}</p>
            <p><strong>Student:</strong> {selectedLog?.studentId?.name}</p>
            <p><strong>Log #:</strong> {selectedLog?.logNumber} ({selectedLog?.type})</p>
            <p className="text-sm text-gray-600 mt-2"><strong>Description:</strong></p>
            <p className="text-sm text-gray-600">{selectedLog?.description}</p>
          </div>
          <Textarea 
            label="Remarks" 
            value={remarks} 
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add your feedback..."
            rows={4}
          />
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
            <Button variant="secondary" onClick={handleReject} type="button">Reject</Button>
            <Button type="submit">Approve</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default SupervisorLogs;

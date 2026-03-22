import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import logService from '../../services/logService';
import groupService from '../../services/groupService';

const StudentLogs = () => {
  const [logs, setLogs] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLogNumber, setSelectedLogNumber] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canSubmitLogs, setCanSubmitLogs] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, groupData] = await Promise.all([
        logService.getMyLogs(),
        groupService.getMyGroup()
      ]);
      
      setLogs(logsData.logs || []);
      const myGroup = groupData.group;
      setGroup(myGroup);
      
      // Check if project is approved by both supervisor and coordinator
      const isApproved = myGroup && 
        myGroup.supervisorApproval === 'APPROVED' && 
        myGroup.coordinatorApproval === 'APPROVED';
      setCanSubmitLogs(isApproved);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    if (!group) {
      alert('You must be part of a group to submit logs');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    try {
      setSubmitting(true);
      const logData = {
        groupId: group._id,
        logNumber: selectedLogNumber,
        description: description.trim()
      };
      
      console.log('Submitting log:', logData);
      await logService.submitLog(logData);
      setIsModalOpen(false);
      setDescription('');
      setSelectedLogNumber(null);
      loadData();
      alert('Log submitted successfully!');
    } catch (error) {
      console.error('Error submitting log:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to submit log';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitModal = (logNumber) => {
    setSelectedLogNumber(logNumber);
    setIsModalOpen(true);
  };

  const getLogStatus = (logNumber) => {
    const log = logs.find(l => l.logNumber === logNumber);
    if (!log) return null;
    return log;
  };

  const renderLogSlot = (logNumber) => {
    const log = getLogStatus(logNumber);
    
    return (
      <div key={logNumber} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800">Log {logNumber}</h3>
          {log ? (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              log.supervisorApproval === 'APPROVED' ? 'bg-green-100 text-green-800' :
              log.supervisorApproval === 'REJECTED' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {log.supervisorApproval}
            </span>
          ) : null}
        </div>
        
        {log ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{log.description}</p>
            <p className="text-xs text-gray-500">
              Submitted: {new Date(log.submittedAt).toLocaleDateString()}
            </p>
            {log.supervisorApproval === 'APPROVED' && log.approvalNotes && (
              <p className="text-xs text-green-700 bg-green-50 p-2 rounded">
                <strong>Supervisor Notes:</strong> {log.approvalNotes}
              </p>
            )}
            {log.supervisorApproval === 'REJECTED' && log.approvalNotes && (
              <p className="text-xs text-red-700 bg-red-50 p-2 rounded">
                <strong>Rejection Reason:</strong> {log.approvalNotes}
              </p>
            )}
          </div>
        ) : (
          <div>
            {canSubmitLogs ? (
              <Button size="sm" onClick={() => openSubmitModal(logNumber)}>
                Submit Log
              </Button>
            ) : (
              <p className="text-sm text-gray-500">
                Project must be approved before submitting logs
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
          <h2 className="text-2xl font-bold text-gray-800">Log Submissions</h2>
          <p className="text-gray-600 mt-1">Submit and track your 24 project logs</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : !group ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">You must be part of a group to submit logs</p>
          </div>
        ) : !canSubmitLogs ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              <strong>Project Not Approved:</strong> Your project must be approved by both supervisor and coordinator before you can submit logs.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Supervisor Status: <strong>{group.supervisorApproval}</strong> | 
              Coordinator Status: <strong>{group.coordinatorApproval}</strong>
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 24 }, (_, i) => i + 1).map(logNumber => renderLogSlot(logNumber))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Submit Log ${selectedLogNumber}`}>
        <form onSubmit={handleSubmitLog}>
          <Textarea
            label="Description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you worked on for this log entry..."
            rows={6}
          />
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Log'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default StudentLogs;

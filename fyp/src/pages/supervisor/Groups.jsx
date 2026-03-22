import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import groupService from '../../services/groupService';

const SupervisorGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [notes, setNotes] = useState('');
  const [approvalType, setApprovalType] = useState('APPROVED');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await groupService.getMySupervisedGroups();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (group, approval) => {
    setSelectedGroup(group);
    setApprovalType(approval);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await groupService.supervisorReview(selectedGroup._id, approvalType, notes);
      setIsModalOpen(false);
      setSelectedGroup(null);
      setNotes('');
      loadData();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.error || 'Failed to submit review');
    }
  };

  const columns = [
    { header: 'Group Name', accessor: 'groupName' },
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
    { header: 'Idea Title', accessor: 'ideaTitle' },
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
      render: (row) => (
        <div className="flex space-x-2">
          {row.supervisorApproval === 'PENDING' ? (
            <>
              <Button size="sm" onClick={() => handleReview(row, 'APPROVED')}>Approve</Button>
              <Button size="sm" variant="secondary" onClick={() => handleReview(row, 'REJECTED')}>Reject</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => navigate(`/supervisor/groups/${row._id}/documents`)}>
              View Docs
            </Button>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout role="supervisor">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">My Groups</h2>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <Table columns={columns} data={groups} />
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Review Group Idea">
        <form onSubmit={handleSubmitReview}>
          <div className="mb-4 space-y-2">
            <p><strong>Group:</strong> {selectedGroup?.groupName}</p>
            <p><strong>Idea:</strong> {selectedGroup?.ideaTitle}</p>
            <p className="text-sm text-gray-600">{selectedGroup?.ideaDescription}</p>
            <p className="mt-3"><strong>Decision:</strong> <span className={approvalType === 'APPROVED' ? 'text-green-600' : 'text-red-600'}>{approvalType}</span></p>
          </div>
          <Textarea 
            label="Notes" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your feedback or suggestions..."
          />
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">{approvalType === 'APPROVED' ? 'Approve' : 'Reject'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default SupervisorGroups;

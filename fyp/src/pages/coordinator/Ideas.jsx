import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import groupService from '../../services/groupService';

const CoordinatorIdeas = () => {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [action, setAction] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await groupService.getAllGroups();
      const groups = data.groups || data || [];
      // Filter to show only supervisor-approved ideas
      const supervisorApproved = groups.filter(g => g.supervisorApproval === 'APPROVED');
      setIdeas(supervisorApproved);
    } catch (error) {
      console.error('Error loading ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    try {
      await groupService.coordinatorReview(selectedIdea._id, action, remarks);
      setIsModalOpen(false);
      setRemarks('');
      loadData();
    } catch (error) {
      console.error('Error updating idea:', error);
      alert(error.response?.data?.error || 'Failed to update idea');
    }
  };

  const columns = [
    { header: 'Group', accessor: 'groupName' },
    { header: 'Title', accessor: 'ideaTitle' },
    { 
      header: 'Supervisor', 
      render: (row) => row.supervisorId?.name || 'N/A'
    },
    { 
      header: 'Submitted', 
      render: (row) => new Date(row.createdAt).toLocaleDateString()
    },
    { 
      header: 'Status', 
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
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="secondary" onClick={() => { setSelectedIdea(row); setAction('VIEW'); setIsModalOpen(true); }}>
            View Details
          </Button>
          {row.coordinatorApproval === 'PENDING' && (
            <>
              <Button size="sm" onClick={() => { setSelectedIdea(row); setAction('APPROVED'); setIsModalOpen(true); }}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setSelectedIdea(row); setAction('DEFERRED'); setIsModalOpen(true); }}>
                Defer
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setSelectedIdea(row); setAction('REJECTED'); setIsModalOpen(true); }}>
                Reject
              </Button>
            </>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout role="coordinator">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Project Ideas</h2>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <Table columns={columns} data={ideas} />
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={action === 'VIEW' ? 'Project Details' : `${action} Idea`}>
        {action === 'VIEW' ? (
          <div className="space-y-4">
            <div>
              <p><strong>Title:</strong> {selectedIdea?.ideaTitle}</p>
              <p className="mt-3"><strong>Description:</strong></p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedIdea?.ideaDescription}</p>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAction}>
            <div className="mb-4 space-y-2">
              <p><strong>Group:</strong> {selectedIdea?.groupName}</p>
              <p><strong>Title:</strong> {selectedIdea?.ideaTitle}</p>
              <p className="text-sm text-gray-600">{selectedIdea?.ideaDescription}</p>
              <p className="mt-3"><strong>Decision:</strong> <span className={action === 'APPROVED' ? 'text-green-600' : action === 'DEFERRED' ? 'text-purple-600' : 'text-red-600'}>{action}</span></p>
            </div>
            <Textarea
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add your comments..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
              <Button type="submit">Confirm</Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default CoordinatorIdeas;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import groupService from '../../services/groupService';
import userService from '../../services/userService';

const CoordinatorGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExaminerModal, setShowExaminerModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [internalExaminers, setInternalExaminers] = useState([]);
  const [externalExaminers, setExternalExaminers] = useState([]);
  const [formData, setFormData] = useState({
    internalExaminer1: '',
    internalExaminer2: '',
    externalExaminer: ''
  });

  useEffect(() => {
    loadData();
    loadExaminers();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await groupService.getAllGroups();
      setGroups(data.groups || data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExaminers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      const internals = allUsers.filter(u => u.role === 'internalexaminer' && u.active);
      const externals = allUsers.filter(u => u.role === 'externalexaminer' && u.active);
      setInternalExaminers(internals);
      setExternalExaminers(externals);
    } catch (error) {
      console.error('Error loading examiners:', error);
    }
  };

  const handleAssignExaminers = (group) => {
    setSelectedGroup(group);
    // Pre-fill if already assigned
    setFormData({
      internalExaminer1: group.internalExaminers?.[0]?._id || '',
      internalExaminer2: group.internalExaminers?.[1]?._id || '',
      externalExaminer: group.externalExaminer?._id || ''
    });
    setShowExaminerModal(true);
  };

  const handleSubmitExaminers = async (e) => {
    e.preventDefault();
    try {
      await groupService.assignExaminers(selectedGroup._id, formData);
      alert('Examiners assigned successfully!');
      setShowExaminerModal(false);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign examiners');
    }
  };

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
    { 
      header: 'Examiners', 
      render: (row) => (
        <div className="text-xs">
          {row.internalExaminers?.length === 2 && row.externalExaminer ? (
            <div className="text-green-600 font-semibold">
              ✓ Assigned
            </div>
          ) : (
            <div className="text-orange-600 font-semibold">
              ⚠ Not Assigned
            </div>
          )}
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
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-col space-y-1">
          <Button size="sm" onClick={() => handleAssignExaminers(row)}>
            Assign Examiners
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/coordinator/projects/${row._id}/logs`)}>
            View Logs
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/coordinator/projects/${row._id}/documents`)}>
            View Docs
          </Button>
        </div>
      )
    },
  ];

  return (
    <DashboardLayout role="coordinator">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">All Groups</h2>
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

      {/* Examiner Assignment Modal */}
      <Modal
        isOpen={showExaminerModal}
        onClose={() => setShowExaminerModal(false)}
        title="Assign Examiners"
      >
        <form onSubmit={handleSubmitExaminers} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group: {selectedGroup?.groupName}
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Assign 2 Internal Examiners and 1 External Examiner
            </p>
          </div>

          <Select
            label="Internal Examiner #1"
            value={formData.internalExaminer1}
            onChange={(e) => setFormData({...formData, internalExaminer1: e.target.value})}
            required
          >
            <option value="">Select Internal Examiner 1</option>
            {internalExaminers.map(examiner => (
              <option 
                key={examiner._id} 
                value={examiner._id}
                disabled={examiner._id === formData.internalExaminer2}
              >
                {examiner.name} ({examiner.email})
              </option>
            ))}
          </Select>

          <Select
            label="Internal Examiner #2"
            value={formData.internalExaminer2}
            onChange={(e) => setFormData({...formData, internalExaminer2: e.target.value})}
            required
          >
            <option value="">Select Internal Examiner 2</option>
            {internalExaminers.map(examiner => (
              <option 
                key={examiner._id} 
                value={examiner._id}
                disabled={examiner._id === formData.internalExaminer1}
              >
                {examiner.name} ({examiner.email})
              </option>
            ))}
          </Select>

          <Select
            label="External Examiner"
            value={formData.externalExaminer}
            onChange={(e) => setFormData({...formData, externalExaminer: e.target.value})}
            required
          >
            <option value="">Select External Examiner</option>
            {externalExaminers.map(examiner => (
              <option key={examiner._id} value={examiner._id}>
                {examiner.name} ({examiner.email})
              </option>
            ))}
          </Select>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              Assign Examiners
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowExaminerModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default CoordinatorGroups;

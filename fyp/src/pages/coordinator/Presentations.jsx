import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import presentationService from '../../services/presentationService';
import groupService from '../../services/groupService';

const CoordinatorPresentations = () => {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    groupId: '',
    type: '',
    date: '',
    time: '',
  });
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [presentationsData, groupsData] = await Promise.all([
        presentationService.getAllPresentations(),
        groupService.getAllGroups(),
      ]);
      
      setPresentations(presentationsData || []);
      
      const allGroups = groupsData.groups || groupsData || [];
      setGroups(allGroups);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (groupId) => {
    const group = groups.find(g => g._id === groupId);
    setSelectedGroup(group);
    setFormData({...formData, groupId});
  };

  const getNotifiedRoles = (type) => {
    if (!selectedGroup) return [];
    const roles = ['Supervisor', 'Students'];
    
    if (type === 'INTERM1' || type === 'INTERM2') {
      if (selectedGroup.internalExaminers?.length === 2) {
        roles.push('2 Internal Examiners');
      } else {
        return [...roles, '⚠️ Need to assign internal examiners first'];
      }
    } else if (type === 'FINAL') {
      if (selectedGroup.internalExaminers?.length === 2 && selectedGroup.externalExaminer) {
        roles.push('2 Internal Examiners', '1 External Examiner');
      } else {
        return [...roles, '⚠️ Need to assign all examiners first'];
      }
    }
    
    return roles;
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await presentationService.createPresentation(formData);
      alert('Presentation scheduled successfully!');
      setIsModalOpen(false);
      setFormData({
        groupId: '',
        type: '',
        date: '',
        time: '',
      });
      setSelectedGroup(null);
      loadData();
    } catch (error) {
      console.error('Error scheduling presentation:', error);
      alert(error.response?.data?.error || 'Failed to schedule presentation');
    }
  };

  const handleMarkCompleted = async (presentationId) => {
    try {
      await presentationService.updatePresentationStatus(presentationId, 'COMPLETED');
      alert('Presentation marked as completed!');
      loadData();
    } catch (error) {
      console.error('Error marking presentation as completed:', error);
      alert(error.response?.data?.error || 'Failed to mark presentation as completed');
    }
  };

  const columns = [
    { 
      header: 'Group', 
      render: (row) => row.groupId?.groupName || 'N/A'
    },
    { header: 'Type', accessor: 'type' },
    { 
      header: 'Date', 
      render: (row) => new Date(row.date).toLocaleDateString()
    },
    { header: 'Time', accessor: 'time' },
    { 
      header: 'Evaluators', 
      render: (row) => {
        const group = row.groupId;
        const type = row.type;
        let evaluators = ['Supervisor'];
        
        if (type === 'INTERM1' || type === 'INTERM2' || type === 'FINAL') {
          evaluators.push('2 Internals');
        }
        if (type === 'FINAL') {
          evaluators.push('1 External');
        }
        
        return (
          <div className="text-xs">
            {evaluators.join(', ')}
          </div>
        );
      }
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.status === 'EVALUATED' ? 'bg-green-100 text-green-800' :
          row.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Action',
      render: (row) => {
        if (row.status === 'COMPLETED') {
          return <span className="text-gray-500 text-xs">Marked Completed</span>;
        }
        return (
          <Button
            size="sm"
            onClick={() => handleMarkCompleted(row._id)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Mark Completed
          </Button>
        );
      }
    },
  ];

  return (
    <DashboardLayout role="coordinator">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Presentations</h2>
          <Button onClick={() => setIsModalOpen(true)}>Schedule Presentation</Button>
        </div>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <Table columns={columns} data={presentations} />
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Presentation">
        <form onSubmit={handleSchedule} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            ℹ️ Examiners are automatically assigned based on group settings. No need to select manually.
          </div>

          <Select 
            label="Group" 
            required 
            value={formData.groupId} 
            onChange={(e) => handleGroupChange(e.target.value)}
          >
            <option value="">Select Group</option>
            {groups.map(g => (
              <option key={g._id} value={g._id}>
                {g.groupName}
              </option>
            ))}
          </Select>

          <Select 
            label="Presentation Type" 
            required 
            value={formData.type} 
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <option value="">Select Type</option>
            <option value="INITIAL">Initial</option>
            <option value="INTERM1">Interim-1</option>
            <option value="INTERM2">Interim-2</option>
            <option value="FINAL">Final</option>
          </Select>

          <Input 
            label="Date" 
            type="date" 
            required 
            value={formData.date} 
            onChange={(e) => setFormData({...formData, date: e.target.value})} 
          />

          <Input 
            label="Time" 
            type="time" 
            required 
            value={formData.time} 
            onChange={(e) => setFormData({...formData, time: e.target.value})} 
          />

          {formData.groupId && formData.type && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-green-800 mb-2">
                Will notify:
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                {getNotifiedRoles(formData.type).map((role, idx) => (
                  <li key={idx}>• {role}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit">
              Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default CoordinatorPresentations;

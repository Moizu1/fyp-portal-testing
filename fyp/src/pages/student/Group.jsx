import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Select from '../../components/Select';
import groupService from '../../services/groupService';
import userService from '../../services/userService';

const StudentGroup = () => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    groupName: '',
    supervisorId: '',
    ideaTitle: '',
    ideaDescription: '',
    secondMemberId: ''
  });
  const [editFormData, setEditFormData] = useState({
    supervisorId: '',
    ideaTitle: '',
    ideaDescription: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupData, supervisorsList, studentsList, assignedUsers] = await Promise.all([
        groupService.getMyGroup(),
        userService.getSupervisors(),
        userService.getStudents(),
        groupService.getAssignedUsers()
      ]);
      
      setGroup(groupData.group || null);
      
      const { assignedSupervisorIds, assignedStudentIds } = assignedUsers;
      
      // Store all supervisors for edit modal
      setAllSupervisors(supervisorsList);
      
      // Filter supervisors - exclude those already assigned to groups (but include current supervisor for editing)
      const currentSupervisorId = groupData.group?.supervisorId?._id;
      const availableSupervisors = supervisorsList.filter(s => 
        !assignedSupervisorIds.includes(s._id) || s._id === currentSupervisorId
      );
      setSupervisors(availableSupervisors);
      
      // Filter students - exclude current user and those already in groups
      const currentUserEmail = localStorage.getItem('email');
      const currentUserId = localStorage.getItem('userId');
      const availableStudents = studentsList.filter(s => 
        s.email !== currentUserEmail && 
        s._id !== currentUserId &&
        !assignedStudentIds.includes(s._id)
      );
      setStudents(availableStudents);

      // Set edit form data from existing group
      if (groupData.group) {
        setEditFormData({
          supervisorId: groupData.group.supervisorId?._id || '',
          ideaTitle: groupData.group.ideaTitle || '',
          ideaDescription: groupData.group.ideaDescription || ''
        });
      }
    } catch (error) {
      console.error('Error loading group:', error);
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      // Get current user ID from localStorage
      const currentUserId = localStorage.getItem('userId');
      
      if (!currentUserId) {
        alert('Unable to get user ID. Please log in again.');
        return;
      }
      
      const members = [currentUserId];
      if (formData.secondMemberId) {
        members.push(formData.secondMemberId);
      }
      
      const groupData = {
        groupName: formData.groupName,
        supervisorId: formData.supervisorId,
        ideaTitle: formData.ideaTitle,
        ideaDescription: formData.ideaDescription,
        members
      };
      
      await groupService.createGroup(groupData);
      setIsModalOpen(false);
      setFormData({ groupName: '', supervisorId: '', ideaTitle: '', ideaDescription: '', secondMemberId: '' });
      loadData();
    } catch (error) {
      console.error('Error creating group:', error);
      alert(error.response?.data?.error || 'Failed to create group');
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    try {
      await groupService.updateGroup(group._id, {
        supervisorId: editFormData.supervisorId,
        ideaTitle: editFormData.ideaTitle,
        ideaDescription: editFormData.ideaDescription
      });
      setIsEditModalOpen(false);
      alert('Group updated and resubmitted successfully');
      loadData();
    } catch (error) {
      console.error('Error updating group:', error);
      alert(error.response?.data?.error || 'Failed to update group');
    }
  };

  const openEditModal = () => {
    setEditFormData({
      supervisorId: group.supervisorId?._id || '',
      ideaTitle: group.ideaTitle || '',
      ideaDescription: group.ideaDescription || ''
    });
    setIsEditModalOpen(true);
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">My Group</h2>
          {!loading && !group && <Button onClick={() => setIsModalOpen(true)}>Create Group</Button>}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : group ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{group.groupName}</h3>
              {(group.supervisorApproval === 'REJECTED' || group.coordinatorApproval === 'REJECTED' || group.coordinatorApproval === 'DEFERRED') && (
                <button
                  onClick={openEditModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
                >
                  Edit & Resubmit
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <strong>Members:</strong>
                <div className="ml-4 mt-1">
                  {group.members?.map((member, idx) => (
                    <p key={idx} className="text-gray-700">• {member.name} ({member.email})</p>
                  ))}
                </div>
              </div>
              <p><strong>Supervisor:</strong> {group.supervisorId?.name || 'Not assigned'}</p>
              <p><strong>Idea:</strong> {group.ideaTitle}</p>
              <p><strong>Description:</strong> {group.ideaDescription}</p>
              <p>
                <strong>Supervisor Approval:</strong>
                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                  group.supervisorApproval === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  group.supervisorApproval === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {group.supervisorApproval}
                </span>
              </p>
              {group.supervisorNotes && (
                <p className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <strong>Supervisor Notes:</strong> {group.supervisorNotes}
                </p>
              )}
              <p>
                <strong>Coordinator Approval:</strong>
                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                  group.coordinatorApproval === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  group.coordinatorApproval === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  group.coordinatorApproval === 'DEFERRED' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {group.coordinatorApproval}
                </span>
              </p>
              {group.coordinatorNotes && (
                <p className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <strong>Coordinator Notes:</strong> {group.coordinatorNotes}
                </p>
              )}
              <p>
                <strong>Status:</strong>
                <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {group.status}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500 mb-4">You are not part of any group yet</p>
            <Button onClick={() => setIsModalOpen(true)}>Create a Group</Button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Group" size="lg">
        <form onSubmit={handleCreateGroup}>
          <Input 
            label="Group Name" 
            required 
            value={formData.groupName} 
            onChange={(e) => setFormData({...formData, groupName: e.target.value})} 
          />
          <Select
            label="Supervisor"
            required
            value={formData.supervisorId}
            onChange={(e) => setFormData({...formData, supervisorId: e.target.value})}
            options={supervisors.map(s => ({ value: s._id, label: `${s.name} (${s.email})` }))}
          />
          <Select
            label="Second Member (Optional)"
            value={formData.secondMemberId}
            onChange={(e) => setFormData({...formData, secondMemberId: e.target.value})}
            options={[
              { value: '', label: 'None - Solo Project' },
              ...students.map(s => ({ value: s._id, label: `${s.name} (${s.email})` }))
            ]}
          />
          <Input 
            label="Project Idea Title" 
            required 
            value={formData.ideaTitle} 
            onChange={(e) => setFormData({...formData, ideaTitle: e.target.value})} 
          />
          <Textarea 
            label="Project Idea Description" 
            required 
            value={formData.ideaDescription} 
            onChange={(e) => setFormData({...formData, ideaDescription: e.target.value})} 
          />
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Create Group</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit & Resubmit Group" size="lg">
        <form onSubmit={handleEditGroup}>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> You are resubmitting your group for approval. All approval statuses will be reset to PENDING.
            </p>
          </div>
          <Select
            label="Change Supervisor (Optional)"
            value={editFormData.supervisorId}
            onChange={(e) => setEditFormData({...editFormData, supervisorId: e.target.value})}
            options={allSupervisors.map(s => ({ value: s._id, label: `${s.name} (${s.email})` }))}
          />
          <Input 
            label="Project Idea Title" 
            required 
            value={editFormData.ideaTitle} 
            onChange={(e) => setEditFormData({...editFormData, ideaTitle: e.target.value})} 
          />
          <Textarea 
            label="Project Idea Description" 
            required 
            value={editFormData.ideaDescription} 
            onChange={(e) => setEditFormData({...editFormData, ideaDescription: e.target.value})} 
          />
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Resubmit Group</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default StudentGroup;

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Button from '../../components/Button';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import evaluationService from '../../services/evaluationService';
import groupService from '../../services/groupService';
import presentationService from '../../services/presentationService';

const SupervisorFinalEvaluation = () => {
  const [myGroups, setMyGroups] = useState([]);
  const [myMarks, setMyMarks] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [marksForm, setMarksForm] = useState({ marks: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, marksData, presentationsData] = await Promise.all([
        groupService.getMySupervisedGroups(),
        evaluationService.getMyMarks(),
        presentationService.getMyPresentations()
      ]);
      
      const groups = groupsData.groups || [];
      setMyGroups(groups);
      setMyMarks(marksData.evaluations || []);
      setPresentations(presentationsData.presentations || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if final presentation is completed
  const isFinalPresentationCompleted = (groupId) => {
    const finalPresentation = presentations.find(p => 
      (p.groupId?._id || p.groupId) === groupId && p.type === 'FINAL'
    );
    return finalPresentation && finalPresentation.status === 'COMPLETED';
  };

  // Check if marks already submitted
  const hasMarksSubmitted = (groupId) => {
    return myMarks.some(m => 
      (m.groupId?._id || m.groupId) === groupId
    );
  };

  // Handle marks submission
  const handleSubmitMarks = async (e) => {
    e.preventDefault();
    if (!selectedGroup || !marksForm.marks) {
      alert('Please fill in marks');
      return;
    }

    try {
      await evaluationService.submitMarks({
        groupId: selectedGroup._id,
        marks: parseFloat(marksForm.marks)
      });
      
      alert('Marks submitted successfully!');
      setShowMarksModal(false);
      setMarksForm({ marks: '' });
      setSelectedGroup(null);
      loadData();
    } catch (error) {
      console.error('Error submitting marks:', error);
      alert(error.response?.data?.error || 'Failed to submit marks');
    }
  };

  // Open marks modal
  const openMarksModal = (group) => {
    setSelectedGroup(group);
    setMarksForm({ marks: '' });
    setShowMarksModal(true);
  };

  // Table columns
  const columns = [
    { 
      header: 'Group', 
      render: (row) => row.groupName || 'N/A'
    },
    {
      header: 'Members',
      render: (row) => (
        <div className="text-sm space-y-1">
          {row.members?.map((m, idx) => (
            <div key={idx}>{m.name}</div>
          ))}
        </div>
      )
    },
    {
      header: 'Final Presentation Status',
      render: (row) => {
        const completed = isFinalPresentationCompleted(row._id);
        return completed ? (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
            ✓ Completed
          </span>
        ) : (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
            Pending
          </span>
        );
      }
    },
    {
      header: 'Your Marks',
      render: (row) => {
        const submitted = hasMarksSubmitted(row._id);
        const marksRecord = myMarks.find(m => 
          (m.groupId?._id || m.groupId) === row._id
        );
        return submitted ? (
          <span className="text-green-600 font-semibold">{marksRecord?.marks}/100</span>
        ) : (
          <span className="text-gray-500">-</span>
        );
      }
    },
    {
      header: 'Action',
      render: (row) => {
        const completed = isFinalPresentationCompleted(row._id);
        const submitted = hasMarksSubmitted(row._id);

        if (submitted) {
          return <span className="text-gray-500 text-xs">Completed</span>;
        }

        return (
          <Button 
            size="sm" 
            onClick={() => openMarksModal(row)}
            disabled={!completed}
            title={!completed ? 'Submit marks only after final presentation is completed' : ''}
          >
            Submit Marks
          </Button>
        );
      }
    }
  ];

  if (loading) {
    return (
      <DashboardLayout role="supervisor">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="supervisor">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Submit Final Marks</h2>
          <p className="text-gray-600 mt-1">Submit final marks for your supervised groups after final presentations are completed</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-600">My Groups</div>
            <div className="text-3xl font-bold text-gray-800 mt-1">{myGroups.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-600">Ready for Marking</div>
            <div className="text-3xl font-bold text-blue-600 mt-1">
              {myGroups.filter(g => isFinalPresentationCompleted(g._id)).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-600">Marks Submitted</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{myMarks.length}</div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-blue-900 font-semibold">How to Submit Marks</h3>
              <ul className="list-disc list-inside text-blue-800 text-sm mt-2 space-y-1">
                <li>You can submit marks <strong>only after the final presentation is completed</strong></li>
                <li>Your marks carry a weight of <strong>40%</strong> in the final grade calculation</li>
                <li>Once you submit marks, the system will wait for marks from internal and external examiners</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Groups Table */}
        {myGroups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 font-medium">No groups to supervise</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <Table columns={columns} data={myGroups} />
          </div>
        )}
      </div>

      {/* Marks Modal */}
      <Modal
        isOpen={showMarksModal}
        onClose={() => setShowMarksModal(false)}
        title="Submit Final Marks"
      >
        {selectedGroup && (
          <form onSubmit={handleSubmitMarks} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div>
                <span className="text-gray-600">Group:</span> <span className="font-semibold text-gray-800">{selectedGroup.groupName}</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Members: {selectedGroup.members?.map(m => m.name).join(', ')}
              </div>
            </div>

            <Input 
              label="Marks (out of 100)" 
              type="number" 
              required 
              min="0" 
              max="100"
              step="0.01"
              value={marksForm.marks} 
              onChange={(e) => setMarksForm({...marksForm, marks: e.target.value})}
              placeholder="Enter marks between 0-100"
            />

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
              <strong>Note:</strong> As the supervisor, your evaluation carries a weight of <strong>40%</strong> in the final grade calculation.
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1">
                Submit Marks
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowMarksModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default SupervisorFinalEvaluation;

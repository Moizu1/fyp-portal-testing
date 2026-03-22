import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import evaluationService from '../../services/evaluationService';
import presentationService from '../../services/presentationService';

const InternalExaminerEvaluations = () => {
  const [presentations, setPresentations] = useState([]);
  const [myRemarks, setMyRemarks] = useState([]);
  const [myMarks, setMyMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Form states
  const [remarksForm, setRemarksForm] = useState({ remarks: '' });
  const [marksForm, setMarksForm] = useState({ marks: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [presentationsData, remarksData, marksData] = await Promise.all([
        presentationService.getMyPresentations(),
        evaluationService.getMyRemarks(),
        evaluationService.getMyMarks()
      ]);
      
      const presentations = presentationsData.presentations || [];
      setPresentations(presentations);
      setMyRemarks(remarksData.evaluations || []);
      setMyMarks(marksData.evaluations || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading presentations');
    } finally {
      setLoading(false);
    }
  };

  // Check if remarks submitted for a presentation
  const hasRemarksSubmitted = (presentationId) => {
    return myRemarks.some(r => 
      (r.presentationId?._id || r.presentationId) === presentationId
    );
  };

  // Check if marks submitted for the group
  const hasMarksSubmitted = (groupId) => {
    return myMarks.some(m => 
      (m.groupId?._id || m.groupId) === groupId
    );
  };

  // Handle remarks submission
  const handleSubmitRemarks = async (e) => {
    e.preventDefault();
    if (!selectedPresentation || !remarksForm.remarks.trim()) {
      alert('Please fill in remarks');
      return;
    }

    try {
      await evaluationService.submitRemarks({
        presentationId: selectedPresentation._id,
        remarks: remarksForm.remarks
      });
      
      alert('Remarks submitted successfully!');
      setShowRemarksModal(false);
      setRemarksForm({ remarks: '' });
      setSelectedPresentation(null);
      loadData();
    } catch (error) {
      console.error('Error submitting remarks:', error);
      alert(error.response?.data?.error || 'Failed to submit remarks');
    }
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

  // Open remarks modal
  const openRemarksModal = (presentation) => {
    setSelectedPresentation(presentation);
    setRemarksForm({ remarks: '' });
    setShowRemarksModal(true);
  };

  // Open marks modal
  const openMarksModal = (group) => {
    setSelectedGroup(group);
    setMarksForm({ marks: '' });
    setShowMarksModal(true);
  };

  // Presentations table columns
  const presentationColumns = [
    { 
      header: 'Group', 
      render: (row) => row.groupId?.groupName || 'N/A'
    },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.type === 'FINAL' ? 'bg-purple-100 text-purple-800' :
          row.type === 'INTERM2' ? 'bg-blue-100 text-blue-800' :
          'bg-cyan-100 text-cyan-800'
        }`}>
          {row.type}
        </span>
      )
    },
    { 
      header: 'Date', 
      render: (row) => new Date(row.date).toLocaleDateString()
    },
    { header: 'Time', accessor: 'time' },
    {
      header: 'Remarks',
      render: (row) => {
        const submitted = hasRemarksSubmitted(row._id);
        return submitted ? (
          <span className="text-green-600 font-semibold text-sm">✓ Submitted</span>
        ) : (
          <span className="text-gray-500 text-sm">Not submitted</span>
        );
      }
    },
    {
      header: 'Action',
      render: (row) => {
        const submitted = hasRemarksSubmitted(row._id);
        return !submitted ? (
          <Button 
            size="sm" 
            onClick={() => openRemarksModal(row)}
          >
            Submit Remarks
          </Button>
        ) : (
          <span className="text-gray-500 text-xs">Done</span>
        );
      }
    }
  ];

  // Get unique groups
  const uniqueGroups = [
    ...new Map(presentations.map(p => [p.groupId?._id, p.groupId])).values()
  ];

  // Groups marks table columns
  const marksColumns = [
    { 
      header: 'Group', 
      render: (row) => row?.groupName || 'N/A'
    },
    {
      header: 'Presentations Required',
      render: (row) => {
        const groupPresentations = presentations.filter(p => 
          (p.groupId?._id || p.groupId) === row._id
        );
        const remarksCount = groupPresentations.filter(p => hasRemarksSubmitted(p._id)).length;
        return `${remarksCount} / ${groupPresentations.length}`;
      }
    },
    {
      header: 'Status',
      render: (row) => {
        const groupPresentations = presentations.filter(p => 
          (p.groupId?._id || p.groupId) === row._id
        );
        const allRemarksSubmitted = groupPresentations.every(p => hasRemarksSubmitted(p._id));
        return allRemarksSubmitted ? (
          <span className="text-green-600 font-semibold text-sm">✓ Ready for Marks</span>
        ) : (
          <span className="text-yellow-600 text-sm">Pending remarks for {groupPresentations.length - groupPresentations.filter(p => hasRemarksSubmitted(p._id)).length} presentation(s)</span>
        );
      }
    },
    {
      header: 'Marks',
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
        const groupPresentations = presentations.filter(p => 
          (p.groupId?._id || p.groupId) === row._id
        );
        const allRemarksSubmitted = groupPresentations.every(p => hasRemarksSubmitted(p._id));
        const marksSubmitted = hasMarksSubmitted(row._id);

        if (marksSubmitted) {
          return <span className="text-gray-500 text-xs">Completed</span>;
        }

        return (
          <Button 
            size="sm" 
            onClick={() => openMarksModal(row)}
            disabled={!allRemarksSubmitted}
            title={!allRemarksSubmitted ? 'Submit remarks for all presentations first' : ''}
          >
            Submit Marks
          </Button>
        );
      }
    }
  ];

  if (loading) {
    return (
      <DashboardLayout role="internalexaminer">
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
    <DashboardLayout role="internalexaminer">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Presentation Evaluations</h2>
          <p className="text-gray-600 mt-1">Two-step evaluation: Submit remarks for presentations, then submit final marks for each group</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-600">Total Presentations</div>
            <div className="text-3xl font-bold text-gray-800 mt-1">{presentations.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-600">Remarks Submitted</div>
            <div className="text-3xl font-bold text-blue-600 mt-1">{myRemarks.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-600">Groups Ready</div>
            <div className="text-3xl font-bold text-purple-600 mt-1">
              {uniqueGroups.filter(g => {
                const groupPresentations = presentations.filter(p => 
                  (p.groupId?._id || p.groupId) === g._id
                );
                return groupPresentations.every(p => hasRemarksSubmitted(p._id));
              }).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-600">Marks Submitted</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{myMarks.length}</div>
          </div>
        </div>

        {/* Step 1: Remarks Submission */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-bold mr-3">1</span>
            Submit Remarks for All Presentations
          </h3>
          
          {presentations.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500">No presentations assigned</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <Table columns={presentationColumns} data={presentations} />
            </div>
          )}
        </div>

        {/* Step 2: Marks Submission */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-sm font-bold mr-3">2</span>
            Submit Final Marks for Groups (After All Remarks Complete)
          </h3>
          
          {uniqueGroups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500">No groups assigned</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <Table columns={marksColumns} data={uniqueGroups} />
            </div>
          )}
        </div>
      </div>

      {/* Remarks Modal */}
      <Modal
        isOpen={showRemarksModal}
        onClose={() => setShowRemarksModal(false)}
        title="Submit Remarks"
      >
        {selectedPresentation && (
          <form onSubmit={handleSubmitRemarks} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600">Group:</span> <span className="font-semibold">{selectedPresentation.groupId?.groupName}</span></div>
                <div><span className="text-gray-600">Presentation Type:</span> <span className="font-semibold">{selectedPresentation.type}</span></div>
                <div><span className="text-gray-600">Date:</span> <span className="font-semibold">{new Date(selectedPresentation.date).toLocaleDateString()}</span></div>
              </div>
            </div>

            <Textarea 
              label="Remarks" 
              required 
              value={remarksForm.remarks} 
              onChange={(e) => setRemarksForm({...remarksForm, remarks: e.target.value})}
              placeholder="Provide your detailed remarks on the presentation..."
              rows={6}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1">
                Submit Remarks
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowRemarksModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Marks Modal */}
      <Modal
        isOpen={showMarksModal}
        onClose={() => setShowMarksModal(false)}
        title="Submit Final Marks"
      >
        {selectedGroup && (
          <form onSubmit={handleSubmitMarks} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm">
                <span className="text-gray-600">Group:</span> <span className="font-semibold">{selectedGroup.groupName}</span>
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Note:</strong> As an internal examiner, your evaluation carries a weight of <strong>15%</strong> in the final grade calculation.
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

export default InternalExaminerEvaluations;

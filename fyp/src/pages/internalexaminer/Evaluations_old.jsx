import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import evaluationService from '../../services/evaluationService';
import presentationService from '../../services/presentationService';

const InternalExaminerEvaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [formData, setFormData] = useState({
    presentationId: '',
    marks: '',
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evaluationsData, presentationsData] = await Promise.all([
        evaluationService.getMyEvaluations(),
        presentationService.getMyPresentations()
      ]);
      
      setEvaluations(evaluationsData.evaluations || []);
      
      // Filter presentations that need evaluation (COMPLETED but not yet evaluated by me)
      const allPresentations = presentationsData.presentations || [];
      const evaluatedPresentationIds = new Set(
        (evaluationsData.evaluations || []).map(e => e.presentationId?._id || e.presentationId)
      );
      
      const pendingPresentations = allPresentations.filter(p => 
        (p.status === 'COMPLETED' || p.status === 'SCHEDULED') && 
        !evaluatedPresentationIds.has(p._id)
      );
      
      setPresentations(pendingPresentations);
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({ presentationId: '', marks: '', remarks: '' });
    setSelectedPresentation(null);
    setIsModalOpen(true);
  };

  const handlePresentationChange = (presentationId) => {
    setFormData({ ...formData, presentationId });
    const presentation = presentations.find(p => p._id === presentationId);
    setSelectedPresentation(presentation);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await evaluationService.submitEvaluation({
        presentationId: formData.presentationId,
        marks: parseFloat(formData.marks),
        remarks: formData.remarks,
        examinerType: 'Internal'
      });
      
      alert('Evaluation submitted successfully!');
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert(error.response?.data?.error || 'Failed to submit evaluation');
    }
  };

  const columns = [
    { 
      header: 'Group', 
      render: (row) => row.presentationId?.groupId?.groupName || 'N/A'
    },
    { 
      header: 'Presentation Type', 
      render: (row) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
          {row.presentationId?.type || 'N/A'}
        </span>
      )
    },
    { 
      header: 'Marks', 
      render: (row) => `${row.marks}/100`
    },
    { 
      header: 'Remarks', 
      accessor: 'remarks',
      render: (row) => (
        <div className="max-w-xs truncate" title={row.remarks}>
          {row.remarks}
        </div>
      )
    },
    { 
      header: 'Date', 
      render: (row) => new Date(row.createdAt).toLocaleDateString()
    },
  ];

  return (
    <DashboardLayout role="internalexaminer">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Evaluations</h2>
            <p className="text-gray-600 mt-1">Submit and view your presentation evaluations</p>
          </div>
          {presentations.length > 0 && (
            <Button onClick={handleOpenModal}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit New Evaluation
            </Button>
          )}
        </div>

        {presentations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-yellow-800 font-semibold">Pending Evaluations</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  You have {presentations.length} presentation(s) waiting for evaluation.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-gray-500 font-medium">No evaluations submitted yet</p>
            <p className="text-gray-400 text-sm mt-1">
              {presentations.length > 0 
                ? 'Click "Submit New Evaluation" to get started' 
                : 'Evaluations will appear here once you submit them'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <Table columns={columns} data={evaluations} />
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Evaluation">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Select Presentation"
            required
            value={formData.presentationId}
            onChange={(e) => handlePresentationChange(e.target.value)}
            options={presentations.map(p => ({
              value: p._id,
              label: `${p.groupId?.groupName || 'Unknown'} - ${p.type} (${new Date(p.date).toLocaleDateString()})`
            }))}
          />

          {selectedPresentation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Presentation Details</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-blue-700">Group:</span> <span className="font-medium text-blue-900">{selectedPresentation.groupId?.groupName}</span></p>
                <p><span className="text-blue-700">Type:</span> <span className="font-medium text-blue-900">{selectedPresentation.type}</span></p>
                <p><span className="text-blue-700">Date:</span> <span className="font-medium text-blue-900">{new Date(selectedPresentation.date).toLocaleDateString()}</span></p>
                <p><span className="text-blue-700">Time:</span> <span className="font-medium text-blue-900">{selectedPresentation.time}</span></p>
              </div>
            </div>
          )}

          <Input 
            label="Marks (out of 100)" 
            type="number" 
            required 
            min="0" 
            max="100"
            value={formData.marks} 
            onChange={(e) => setFormData({...formData, marks: e.target.value})}
            placeholder="Enter marks"
          />
          
          <Textarea 
            label="Remarks" 
            required 
            value={formData.remarks} 
            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
            placeholder="Provide your feedback and comments..."
            rows={4}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit">
              Submit Evaluation
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default InternalExaminerEvaluations;

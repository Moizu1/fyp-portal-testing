import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import gradeService from '../../services/gradeService';
import groupService from '../../services/groupService';

const CoordinatorFinalGrades = () => {
  const [grades, setGrades] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGradeDetails, setSelectedGradeDetails] = useState(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gradesData, groupsData] = await Promise.all([
        gradeService.getAllGrades(),
        groupService.getAllGroups()
      ]);
      
      setGrades(gradesData || []);
      
      const allGroups = groupsData.groups || groupsData || [];
      // Filter groups that are approved and have final presentations
      const eligibleGroups = allGroups.filter(g => 
        g.coordinatorApproval === 'APPROVED' && g.status !== 'COMPLETED'
      );
      setGroups(eligibleGroups);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateGrade = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) {
      alert('Please select a group');
      return;
    }
    
    try {
      setCalculating(true);
      const result = await gradeService.calculateFinalGrade(selectedGroupId);
      setIsModalOpen(false);
      setSelectedGroupId('');
      loadData();
      
      // Show calculation details
      setSelectedGradeDetails(result);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error calculating grade:', error);
      alert(error.response?.data?.error || 'Failed to calculate grade. Make sure all evaluations (Supervisor + 2 Internals + 1 External) are submitted.');
    } finally {
      setCalculating(false);
    }
  };

  const viewGradeDetails = async (groupId) => {
    try {
      const details = await gradeService.getGroupGrade(groupId);
      setSelectedGradeDetails(details);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching grade details:', error);
      alert('Failed to load grade details');
    }
  };

  const columns = [
    { header: 'Group', accessor: 'groupName' },
    { 
      header: 'Supervisor', 
      render: (row) => row.supervisor?.name || 'N/A'
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
    { header: 'Idea', accessor: 'ideaTitle' },
    { 
      header: 'Final Grade', 
      render: (row) => (
        <div className="font-bold text-lg text-green-700">
          {row.finalGrade?.toFixed(2)}
        </div>
      )
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button size="sm" onClick={() => viewGradeDetails(row.id)}>
          View Details
        </Button>
      )
    }
  ];

  return (
    <DashboardLayout role="coordinator">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Final Grades</h2>
            <p className="text-sm text-gray-600 mt-1">
              Weight: Supervisor 40% | Internal1 15% | Internal2 15% | External 30%
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>Calculate Grade</Button>
        </div>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <Table columns={columns} data={grades} />
          </div>
        )}
      </div>

      {/* Calculate Grade Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Calculate Final Grade">
        <form onSubmit={handleCalculateGrade} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Weighted Formula:</strong>
            <ul className="mt-2 space-y-1">
              <li>• Supervisor: <strong>40%</strong></li>
              <li>• Internal Examiner #1: <strong>15%</strong></li>
              <li>• Internal Examiner #2: <strong>15%</strong></li>
              <li>• External Examiner: <strong>30%</strong></li>
            </ul>
          </div>

          <Select 
            label="Select Group" 
            required 
            value={selectedGroupId} 
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            <option value="">Select a group</option>
            {groups.map(g => (
              <option key={g._id} value={g._id}>
                {g.groupName} - {g.ideaTitle}
              </option>
            ))}
          </Select>

          <p className="text-sm text-gray-600 mt-2">
            ⚠️ All 4 evaluations must be submitted: Supervisor + 2 Internal Examiners + 1 External Examiner
          </p>

          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={calculating}>
              {calculating ? 'Calculating...' : 'Calculate Final Grade'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Grade Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        title="Final Grade Breakdown"
      >
        {selectedGradeDetails && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                Group: {selectedGradeDetails.group?.groupName}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedGradeDetails.group?.ideaTitle}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Evaluator Marks:</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-600 font-semibold">SUPERVISOR (40%)</div>
                  <div className="text-2xl font-bold text-purple-700 mt-1">
                    {selectedGradeDetails.marks?.supervisor || 'N/A'}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 font-semibold">INTERNAL #1 (15%)</div>
                  <div className="text-2xl font-bold text-blue-700 mt-1">
                    {selectedGradeDetails.marks?.internal1 || 'N/A'}
                  </div>
                </div>

                <div className="bg-cyan-50 rounded-lg p-3">
                  <div className="text-xs text-cyan-600 font-semibold">INTERNAL #2 (15%)</div>
                  <div className="text-2xl font-bold text-cyan-700 mt-1">
                    {selectedGradeDetails.marks?.internal2 || 'N/A'}
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-xs text-orange-600 font-semibold">EXTERNAL (30%)</div>
                  <div className="text-2xl font-bold text-orange-700 mt-1">
                    {selectedGradeDetails.marks?.external || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
              <div className="text-sm text-green-700 font-semibold">FINAL GRADE</div>
              <div className="text-4xl font-bold text-green-800 mt-1">
                {selectedGradeDetails.finalGrade?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-xs text-green-600 mt-2">
                {selectedGradeDetails.calculationMethod}
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              Both students in the group receive the same final grade.
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default CoordinatorFinalGrades;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import Button from '../../components/Button';
import presentationService from '../../services/presentationService';

const InternalExaminerGroups = () => {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await presentationService.getMyPresentations();
      const presentationsList = data.presentations || [];
      
      // Group presentations by groupId to avoid duplicates
      const groupMap = new Map();
      presentationsList.forEach(presentation => {
        const groupId = presentation.groupId?._id || presentation.groupId;
        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            _id: groupId,
            groupName: presentation.groupId?.groupName || 'Unknown',
            members: presentation.groupId?.members || [],
            supervisorId: presentation.groupId?.supervisorId || null,
            ideaTitle: presentation.groupId?.ideaTitle || 'N/A',
            presentations: []
          });
        }
        groupMap.get(groupId).presentations.push(presentation);
      });
      
      setPresentations(Array.from(groupMap.values()));
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Group Name', accessor: 'groupName' },
    { 
      header: 'Members', 
      render: (row) => (
        <div className="text-sm">
          {row.members?.map((m, idx) => (
            <div key={idx}>{m.name || m}</div>
          ))}
        </div>
      )
    },
    { 
      header: 'Supervisor', 
      render: (row) => row.supervisorId?.name || 'N/A'
    },
    { 
      header: 'Idea', 
      accessor: 'ideaTitle'
    },
    { 
      header: 'Assigned Presentations', 
      render: (row) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
          {row.presentations?.length || 0} Presentations
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/internalexaminer/groups/${row._id}/documents`)}
          >
            View Docs
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate('/internalexaminer/evaluations')}
          >
            Evaluate
          </Button>
        </div>
      )
    },
  ];

  return (
    <DashboardLayout role="internalexaminer">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assigned Groups</h2>
          <p className="text-gray-600 mt-1">Groups where you are assigned as internal examiner</p>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : presentations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 font-medium">No groups assigned yet</p>
            <p className="text-gray-400 text-sm mt-1">You will see groups here once coordinator assigns you as internal examiner</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <Table columns={columns} data={presentations} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InternalExaminerGroups;

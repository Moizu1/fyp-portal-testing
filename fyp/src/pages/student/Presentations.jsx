import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import presentationService from '../../services/presentationService';
import groupService from '../../services/groupService';

const StudentPresentations = () => {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const groupData = await groupService.getMyGroup();
      if (groupData.group) {
        setGroup(groupData.group);
        const presData = await presentationService.getPresentationsByGroup(groupData.group._id);
        setPresentations(presData.presentations || []);
      }
    } catch (error) {
      console.error('Error loading presentations:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Type', accessor: 'type' },
    { 
      header: 'Date', 
      render: (row) => new Date(row.date).toLocaleDateString()
    },
    { header: 'Time', accessor: 'time' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
          row.status === 'EVALUATED' ? 'bg-purple-100 text-purple-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {row.status}
        </span>
      )
    },
  ];

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Presentation Schedule</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading presentations...</div>
          ) : !group ? (
            <div className="p-8 text-center text-gray-500">You must be in a group to view presentations</div>
          ) : (
            <Table columns={columns} data={presentations} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentPresentations;

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import gradeService from '../../services/gradeService';

const StudentGrades = () => {
  const [grade, setGrade] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await gradeService.getMyGrade();
      setGrade(data.grade || null);
    } catch (error) {
      console.error('Error loading grade:', error);
      setGrade(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">My Grades</h2>
        
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Loading grades...</p>
          </div>
        ) : grade && grade.finalGrade ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <p className="text-gray-500 text-sm mb-2">Final Grade</p>
              <p className="text-6xl font-bold text-purple-600">{grade.finalGrade.toFixed(2)}</p>
              <p className="text-xl text-gray-600 mt-2">Out of 100</p>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700"><strong>Group:</strong> {grade.groupName}</p>
              <p className="text-sm text-gray-700"><strong>Status:</strong> {grade.status}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Grades not published yet</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentGrades;

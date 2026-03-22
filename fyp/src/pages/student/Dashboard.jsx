import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import groupService from '../../services/groupService';
import logService from '../../services/logService';
import presentationService from '../../services/presentationService';
import documentService from '../../services/documentService';

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [logs, setLogs] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingSubmissions: 0,
    completedTasks: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch student's group
      const groupData = await groupService.getMyGroup();
      const studentGroup = groupData?.group || null;
      setGroup(studentGroup);
      
      if (studentGroup) {
        try {
          // Fetch logs
          const logsData = await logService.getMyLogs();
          const myLogs = Array.isArray(logsData?.logs) ? logsData.logs : 
                         Array.isArray(logsData) ? logsData : [];
          setLogs(myLogs);
          
          // Fetch documents
          const docsData = await documentService.getDocumentsByGroup(studentGroup._id);
          const myDocs = Array.isArray(docsData?.documents) ? docsData.documents : 
                        Array.isArray(docsData) ? docsData : [];
          
          // Fetch presentations
          const presData = await presentationService.getPresentationsByGroup(studentGroup._id);
          const myPres = Array.isArray(presData?.presentations) ? presData.presentations : 
                        Array.isArray(presData) ? presData : [];
          setPresentations(myPres);
          
          // Calculate stats
          const completedLogs = myLogs.filter(log => log.approvalStatus === 'APPROVED').length;
          const pendingLogs = myLogs.filter(log => log.approvalStatus === 'PENDING').length;
          const upcomingPresentations = myPres.filter(p => p.status === 'SCHEDULED').length;
          
          setStats({
            activeProjects: studentGroup ? 1 : 0,
            pendingSubmissions: pendingLogs + upcomingPresentations,
            completedTasks: completedLogs + myDocs.length
          });
        } catch (err) {
          console.error('Error fetching group-related data:', err);
          // Set empty arrays if fetch fails
          setLogs([]);
          setPresentations([]);
        }
      } else {
        // No group, set everything to empty
        setLogs([]);
        setPresentations([]);
        setStats({
          activeProjects: 0,
          pendingSubmissions: 0,
          completedTasks: 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Active Projects</h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">{stats.activeProjects}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  {group ? group.status : 'No group'}
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Pending Submissions</h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">{stats.pendingSubmissions}</p>
                <p className="text-sm text-orange-600 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Due soon
                </p>
              </div>
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Completed Tasks</h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">{stats.completedTasks}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Great progress
                </p>
              </div>
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Recent Activities
            </h2>
            <div className="space-y-4">
              {logs.length > 0 ? (
                logs.slice(0, 5).map((log, idx) => {
                  const isApproved = log.approvalStatus?.toUpperCase() === 'APPROVED';
                  const isPending = log.approvalStatus?.toUpperCase() === 'PENDING';
                  const statusColor = isApproved ? 'green' : isPending ? 'orange' : 'gray';
                  
                  return (
                    <div key={log._id || idx} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 bg-${statusColor}-100 rounded-xl flex items-center justify-center shrink-0`}>
                        <svg className={`w-5 h-5 text-${statusColor}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {log.title || `Log #${log.logNumber || idx + 1}`}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-800`}>
                        {log.approvalStatus || 'Pending'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">No activities yet</p>
                  <p className="text-gray-400 text-sm mt-1">Your project logs will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;

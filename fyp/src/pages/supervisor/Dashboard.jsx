import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import groupService from '../../services/groupService';
import logService from '../../services/logService';

const SupervisorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeProjects: 0,
    pendingReviews: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const groupsData = await groupService.getMySupervisedGroups();
      const logsData = await logService.getSupervisorLogs();
      
      setGroups(groupsData.groups || []);
      setLogs(logsData.logs || []);
      
      // Calculate stats
      const totalStudents = groupsData.groups?.reduce((sum, g) => sum + (g.members?.length || 0), 0) || 0;
      const activeProjects = groupsData.groups?.length || 0;
      const pendingReviews = groupsData.groups?.filter(g => g.supervisorApproval === 'PENDING').length || 0;
      const pendingLogs = logsData.logs?.filter(l => !l.approved).length || 0;
      
      setStats({
        totalStudents,
        activeProjects,
        pendingReviews: pendingReviews + pendingLogs
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="supervisor">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="supervisor">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Supervised Students</h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalStudents}</p>
                <p className="text-sm text-blue-600 mt-2 font-medium">{groups.length} groups</p>
              </div>
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Active Projects</h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">{stats.activeProjects}</p>
                <p className="text-sm text-green-600 mt-2 font-medium">Supervised groups</p>
              </div>
              <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Pending Reviews</h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">{stats.pendingReviews}</p>
                <p className="text-sm text-orange-600 mt-2 font-medium">{stats.pendingReviews > 0 ? 'Needs attention' : 'All clear'}</p>
              </div>
              <div className="w-14 h-14 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Groups List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            My Groups
          </h2>
          {groups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No groups assigned yet</p>
          ) : (
            <div className="space-y-3">
              {groups.slice(0, 5).map((group, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{group.groupName}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {group.members?.map(m => m.name).join(', ')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 ${
                    group.supervisorApproval === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    group.supervisorApproval === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {group.supervisorApproval}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupervisorDashboard;

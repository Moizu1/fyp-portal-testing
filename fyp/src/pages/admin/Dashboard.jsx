import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import userService from '../../services/userService';
import groupService from '../../services/groupService';
import auditService from '../../services/auditService';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeStudents: 0,
    supervisors: 0
  });
  const [recentActions, setRecentActions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users (returns array directly)
      const users = await userService.getAllUsers();
      
      // Fetch all groups (returns array directly)
      const groups = await groupService.getAllGroups();
      
      // Fetch recent audit logs (returns array directly)
      const auditLogs = await auditService.getAllAuditLogs({ page: 1, limit: 10 });
      setRecentActions(auditLogs);
      
      // Calculate stats
      const activeStudents = users.filter(u => u.role === 'student' && u.active).length;
      const supervisors = users.filter(u => u.role === 'supervisor').length;
      
      setStats({
        totalUsers: users.length,
        totalProjects: groups.length,
        activeStudents,
        supervisors
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
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
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Users', value: stats.totalUsers, icon: 'users', color: 'purple', change: `${stats.activeStudents} active` },
            { title: 'Total Projects', value: stats.totalProjects, icon: 'folder', color: 'blue', change: 'All groups' },
            { title: 'Active Students', value: stats.activeStudents, icon: 'academic', color: 'green', change: 'Enrolled' },
            { title: 'Supervisors', value: stats.supervisors, icon: 'badge', color: 'orange', change: 'Faculty' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide">{stat.title}</h3>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-2 font-medium">{stat.change}</p>
                </div>
                <div className={`w-14 h-14 bg-linear-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-2xl flex items-center justify-center shadow-lg shadow-${stat.color}-200`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid - Recent Actions + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Actions - Left Column */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Actions</h2>
            <div className="space-y-4">
              {recentActions.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{item.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {recentActions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent actions</p>
              )}
            </div>
          </div>

          {/* Admin Quick Actions - Right Column */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { title: 'Manage Users', icon: 'users', color: 'purple', path: '/admin/users' },
                { title: 'View Groups', icon: 'cog', color: 'blue', path: '/admin/groups' },
                { title: 'Audit Logs', icon: 'chart', color: 'green', path: '/admin/audit-logs' },
                { title: 'System Stats', icon: 'document', color: 'orange', path: '/admin/dashboard' },
              ].map((action, idx) => (
                <button 
                  key={idx} 
                  onClick={() => window.location.href = action.path}
                  className={`w-full bg-white hover:bg-${action.color}-50 border-2 border-${action.color}-200 rounded-lg p-4 transition-all duration-200 transform hover:scale-105 hover:shadow-lg text-left flex items-center space-x-3`}
                >
                  <div className={`w-10 h-10 bg-${action.color}-100 rounded-lg flex items-center justify-center shrink-0`}>
                    <svg className={`w-5 h-5 text-${action.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{action.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

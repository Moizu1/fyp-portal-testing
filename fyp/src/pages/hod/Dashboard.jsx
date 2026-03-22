import DashboardLayout from '../../components/DashboardLayout';

const HodDashboard = () => {
  return (
    <DashboardLayout role="hod">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Projects', value: '45', icon: 'folder', color: 'purple', metric: '15 completed' },
            { title: 'Faculty Members', value: '25', icon: 'users', color: 'blue', metric: '20 active' },
            { title: 'Students', value: '120', icon: 'academic', color: 'green', metric: '95% active' },
            { title: 'Success Rate', value: '92%', icon: 'chart', color: 'orange', metric: '+3% this year' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide">{stat.title}</h3>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-600 mt-2 font-medium">{stat.metric}</p>
                </div>
                <div className={`w-14 h-14 bg-linear-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-2xl flex items-center justify-center shadow-lg shadow-${stat.color}-200`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Department Overview
            </h2>
            <p className="text-gray-600">Monitor department performance, manage faculty resources, and oversee all FYP activities.</p>
          </div>

          <div className="bg-linear-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
            <div className="space-y-3">
              {['Faculty Performance', 'Department Reports', 'Resource Allocation', 'Strategic Planning'].map((action, idx) => (
                <button key={idx} className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-3 px-4 rounded-xl transition-all duration-200 text-left font-medium">
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HodDashboard;

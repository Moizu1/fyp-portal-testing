import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Student imports
import StudentDashboard from './pages/student/Dashboard';
import StudentGroup from './pages/student/Group';
import StudentIdea from './pages/student/Idea';
import StudentDocuments from './pages/student/Documents';
import StudentLogs from './pages/student/Logs';
import StudentPresentations from './pages/student/Presentations';
import StudentGrades from './pages/student/Grades';

// Supervisor imports
import SupervisorDashboard from './pages/supervisor/Dashboard';
import SupervisorGroups from './pages/supervisor/Groups';
import SupervisorLogs from './pages/supervisor/Logs';
import SupervisorFinalEvaluation from './pages/supervisor/FinalEvaluation';
import SupervisorDocuments from './pages/supervisor/Documents';

// Admin imports
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminGroups from './pages/admin/Groups';

// Coordinator imports
import CoordinatorDashboard from './pages/coordinator/Dashboard';
import CoordinatorGroups from './pages/coordinator/Groups';
import CoordinatorIdeas from './pages/coordinator/Ideas';
import CoordinatorPresentations from './pages/coordinator/Presentations';
import CoordinatorFinalGrades from './pages/coordinator/FinalGrades';
import CoordinatorProjectLogs from './pages/coordinator/ProjectLogs';
import CoordinatorDocuments from './pages/coordinator/Documents';

// Internal Examiner imports
import InternalExaminerDashboard from './pages/internalexaminer/Dashboard';
import InternalExaminerEvaluations from './pages/internalexaminer/Evaluations';
import InternalExaminerGroups from './pages/internalexaminer/Groups';
import InternalExaminerGroupDocuments from './pages/internalexaminer/GroupDocuments';

// External Examiner imports
import ExternalExaminerDashboard from './pages/externalexaminer/Dashboard';
import ExternalExaminerEvaluations from './pages/externalexaminer/Evaluations';

// HOD imports
import HodDashboard from './pages/hod/Dashboard';
import HodOverview from './pages/hod/Overview';
import HodFaculty from './pages/hod/Faculty';
import HodProjects from './pages/hod/Projects';
import HodProfile from './pages/hod/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Login Route */}
          <Route path="/" element={<Login />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/group" element={<ProtectedRoute allowedRoles={['student']}><StudentGroup /></ProtectedRoute>} />
          <Route path="/student/idea" element={<ProtectedRoute allowedRoles={['student']}><StudentIdea /></ProtectedRoute>} />
          <Route path="/student/documents" element={<ProtectedRoute allowedRoles={['student']}><StudentDocuments /></ProtectedRoute>} />
          <Route path="/student/logs" element={<ProtectedRoute allowedRoles={['student']}><StudentLogs /></ProtectedRoute>} />
          <Route path="/student/presentations" element={<ProtectedRoute allowedRoles={['student']}><StudentPresentations /></ProtectedRoute>} />
          <Route path="/student/grades" element={<ProtectedRoute allowedRoles={['student']}><StudentGrades /></ProtectedRoute>} />

          {/* Supervisor Routes */}
          <Route path="/supervisor/dashboard" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorDashboard /></ProtectedRoute>} />
          <Route path="/supervisor/groups" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorGroups /></ProtectedRoute>} />
          <Route path="/supervisor/groups/:groupId/documents" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorDocuments /></ProtectedRoute>} />
          <Route path="/supervisor/logs" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorLogs /></ProtectedRoute>} />
          <Route path="/supervisor/final-evaluation" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorFinalEvaluation /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AdminAuditLogs /></ProtectedRoute>} />
          <Route path="/admin/groups" element={<ProtectedRoute allowedRoles={['admin']}><AdminGroups /></ProtectedRoute>} />

          {/* Coordinator Routes */}
          <Route path="/coordinator/dashboard" element={<ProtectedRoute allowedRoles={['coordinator']}><CoordinatorDashboard /></ProtectedRoute>} />
          <Route path="/coordinator/groups" element={<ProtectedRoute allowedRoles={['coordinator']}><CoordinatorGroups /></ProtectedRoute>} />
          <Route path="/coordinator/ideas" element={<ProtectedRoute allowedRoles={['coordinator']}><CoordinatorIdeas /></ProtectedRoute>} />
          <Route path="/coordinator/presentations" element={<ProtectedRoute allowedRoles={['coordinator']}><CoordinatorPresentations /></ProtectedRoute>} />
          <Route path="/coordinator/final-grades" element={<ProtectedRoute allowedRoles={['coordinator']}><CoordinatorFinalGrades /></ProtectedRoute>} />
          <Route path="/coordinator/projects/:groupId/logs" element={<ProtectedRoute allowedRoles={['coordinator']}><CoordinatorProjectLogs /></ProtectedRoute>} />
          <Route path="/coordinator/projects/:groupId/documents" element={<ProtectedRoute allowedRoles={['coordinator']}><CoordinatorDocuments /></ProtectedRoute>} />

          {/* Internal Examiner Routes */}
          <Route path="/internalexaminer/dashboard" element={<ProtectedRoute allowedRoles={['internalexaminer']}><InternalExaminerDashboard /></ProtectedRoute>} />
          <Route path="/internalexaminer/evaluations" element={<ProtectedRoute allowedRoles={['internalexaminer']}><InternalExaminerEvaluations /></ProtectedRoute>} />
          <Route path="/internalexaminer/groups" element={<ProtectedRoute allowedRoles={['internalexaminer']}><InternalExaminerGroups /></ProtectedRoute>} />
          <Route path="/internalexaminer/groups/:groupId/documents" element={<ProtectedRoute allowedRoles={['internalexaminer']}><InternalExaminerGroupDocuments /></ProtectedRoute>} />

          {/* External Examiner Routes */}
          <Route path="/externalexaminer/dashboard" element={<ProtectedRoute allowedRoles={['externalexaminer']}><ExternalExaminerDashboard /></ProtectedRoute>} />
          <Route path="/externalexaminer/evaluations" element={<ProtectedRoute allowedRoles={['externalexaminer']}><ExternalExaminerEvaluations /></ProtectedRoute>} />

          {/* HOD Routes */}
          <Route path="/hod/dashboard" element={<ProtectedRoute allowedRoles={['hod']}><HodDashboard /></ProtectedRoute>} />
          <Route path="/hod/overview" element={<ProtectedRoute allowedRoles={['hod']}><HodOverview /></ProtectedRoute>} />
          <Route path="/hod/faculty" element={<ProtectedRoute allowedRoles={['hod']}><HodFaculty /></ProtectedRoute>} />
          <Route path="/hod/projects" element={<ProtectedRoute allowedRoles={['hod']}><HodProjects /></ProtectedRoute>} />
          <Route path="/hod/profile" element={<ProtectedRoute allowedRoles={['hod']}><HodProfile /></ProtectedRoute>} />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

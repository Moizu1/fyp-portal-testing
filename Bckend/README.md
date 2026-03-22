# FYP Portal Backend System

Complete backend system for a university Final Year Project (FYP) Portal built with Node.js, Express, MongoDB, and Cloudinary.

## 🚀 Features

- **Role-Based Access Control** (6 roles: Admin, Coordinator, Supervisor, Internal Examiner, External Examiner, Student)
- **JWT Authentication** with bcrypt password hashing
- **Group Management** with supervisor and coordinator approval workflow
- **Presentation Scheduling** (Initial, Interm1, Interm2, Final)
- **Document Upload** to Cloudinary (SDS, SRS, Final Documents)
- **Log Submission** system with supervisor approval
- **Evaluation System** with locked submissions
- **Grade Calculation** for final presentations
- **External Examiner Validation** (max 2 groups per examiner)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Cloudinary account

## 🔧 Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
   - MongoDB connection string
   - JWT secret key
   - Cloudinary credentials

## 🏃 Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - Get all users (Admin, Coordinator)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Groups
- `POST /api/groups/create` - Create group (Students)
- `POST /api/groups/add-member` - Add member to group
- `PUT /api/groups/:groupId/supervisor-review` - Supervisor approval
- `PUT /api/groups/:groupId/submit-to-coordinator` - Submit to coordinator
- `PUT /api/groups/:groupId/coordinator-review` - Coordinator approval
- `GET /api/groups` - Get all groups (Admin, Coordinator)
- `GET /api/groups/:groupId` - Get group by ID
- `GET /api/groups/supervisor/my-groups` - Get supervisor's groups
- `GET /api/groups/student/my-group` - Get student's group
- `PUT /api/groups/:groupId/status` - Update group status (Coordinator)

### Presentations
- `POST /api/presentations/create` - Create presentation (Coordinator)
- `PUT /api/presentations/:presentationId/assign-examiner` - Assign examiner
- `GET /api/presentations` - Get all presentations
- `GET /api/presentations/:presentationId` - Get presentation by ID
- `GET /api/presentations/group/:groupId` - Get presentations by group
- `GET /api/presentations/examiner/my-presentations` - Get examiner's presentations
- `PUT /api/presentations/:presentationId/status` - Update status
- `PUT /api/presentations/:presentationId/result` - Update result

### Documents
- `POST /api/documents/upload` - Upload document (Students)
- `GET /api/documents/group/:groupId` - Get documents by group
- `GET /api/documents/:documentId` - Get document by ID
- `DELETE /api/documents/:documentId` - Delete document
- `GET /api/documents` - Get all documents (Admin, Coordinator)
- `GET /api/documents/examiner/my-documents` - Get examiner's documents

### Logs
- `POST /api/logs/submit` - Submit log (Students)
- `PUT /api/logs/:logId/approve` - Approve log (Supervisor)
- `GET /api/logs/group/:groupId` - Get logs by group
- `GET /api/logs/student/my-logs` - Get student's logs
- `GET /api/logs/supervisor/my-logs` - Get supervisor's logs
- `GET /api/logs` - Get all logs (Admin, Coordinator)
- `PUT /api/logs/:logId` - Update log (Students)
- `DELETE /api/logs/:logId` - Delete log

### Evaluations
- `POST /api/evaluations/submit` - Submit evaluation (Examiners)
- `GET /api/evaluations/presentation/:presentationId` - Get evaluations by presentation
- `GET /api/evaluations/group/:groupId` - Get evaluations by group
- `GET /api/evaluations/examiner/my-evaluations` - Get examiner's evaluations
- `GET /api/evaluations` - Get all evaluations (Admin, Coordinator)
- `GET /api/evaluations/check/:presentationId` - Check evaluation status
- `GET /api/evaluations/final/:groupId` - Get final evaluations

### Grades
- `POST /api/grades/calculate/:groupId` - Calculate final grade (Coordinator)
- `GET /api/grades/group/:groupId` - Get group's final grade
- `GET /api/grades` - Get all grades (Admin, Coordinator)
- `GET /api/grades/my-grade` - Get student's grade

## 🔐 User Roles

1. **ADMIN** - Full system access
2. **COORDINATOR** - Manages presentations, approvals, and grading
3. **SUPERVISOR** - Approves groups and logs, evaluates presentations
4. **INTERNAL_EXAMINER** - Evaluates presentations
5. **EXTERNAL_EXAMINER** - Evaluates final presentations (max 2 groups)
6. **STUDENT** - Creates groups, uploads documents, submits logs

## 📊 FYP Workflow

1. **Group Formation** - Students create group and select supervisor
2. **Supervisor Approval** - Supervisor approves/rejects group idea
3. **Coordinator Approval** - Coordinator approves/rejects/defers
4. **Initial Presentation** - Coordinator schedules and evaluates
5. **Interm-1** - Internal examiner assigned, presentation conducted
6. **Log Submission (1-8)** - Students submit logs with supervisor signature
7. **SDS/SRS Upload** - Students upload documents
8. **Interm-2** - 80% work presentation
9. **Log Submission (9-24)** - Additional logs submitted
10. **Final Document Upload** - Final project document
11. **Final Presentation** - 3 evaluators (Supervisor, Internal, External)
12. **Grade Calculation** - Coordinator calculates final grade

## 📁 Project Structure

```
/config
  cloudinary.js - Cloudinary configuration
  db.js - MongoDB connection
/controllers
  authController.js
  userController.js
  groupController.js
  presentationController.js
  documentController.js
  logController.js
  evaluationController.js
  gradeController.js
/middleware
  auth.js - Authentication & authorization
/models
  User.js
  Group.js
  Presentation.js
  ExaminerAssignment.js
  Evaluation.js
  Document.js
  Log.js
/routes
  authRoutes.js
  userRoutes.js
  groupRoutes.js
  presentationRoutes.js
  documentRoutes.js
  logRoutes.js
  evaluationRoutes.js
  gradeRoutes.js
/utils
  uploadHelper.js - Cloudinary upload utilities
  validation.js - Validation helpers
server.js - Main application file
```

## 🛡️ Security Features

- Bcrypt password hashing
- JWT token authentication
- Role-based access control
- Protected routes with middleware
- Input validation
- Unique constraint on evaluations (one submission per examiner)

## ⚙️ Environment Variables

See `.env.example` for required environment variables.

## 📝 Notes

- External examiners can evaluate maximum 2 groups for final presentations
- Groups can have maximum 2 members
- Each examiner can submit evaluation only once per presentation
- Marks must be between 0 and 100
- Final grade is calculated from 3 evaluations (Supervisor, Internal, External)
- Supports both simple average and weighted average grade calculation

## 🤝 Contributing

This is a university project. For any issues or suggestions, please contact the development team.

## 📄 License

ISC

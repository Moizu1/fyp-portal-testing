require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const presentationRoutes = require('./routes/presentationRoutes');
const documentRoutes = require('./routes/documentRoutes');
const logRoutes = require('./routes/logRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// Configure Cloudinary
configureCloudinary();

// Test Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'FYP Portal Backend Server is Running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      groups: '/api/groups',
      presentations: '/api/presentations',
      documents: '/api/documents',
      logs: '/api/logs',
      evaluations: '/api/evaluations',
      grades: '/api/grades',
      auditLogs: '/api/audit-logs'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/presentations', presentationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/audit-logs', auditRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
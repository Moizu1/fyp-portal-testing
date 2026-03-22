const mongoose = require('mongoose');

const examinerAssignmentSchema = new mongoose.Schema({
  presentationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Presentation',
    required: true
  },
  examinerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['SUPERVISOR', 'INTERNAL', 'EXTERNAL'],
    required: true
  }
}, {
  timestamps: true
});

const ExaminerAssignment = mongoose.model('ExaminerAssignment', examinerAssignmentSchema);

module.exports = ExaminerAssignment;

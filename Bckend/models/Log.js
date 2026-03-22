const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  logNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 24
  },
  type: {
    type: String,
    enum: ['LOG1-LOG8', 'LOG9-LOG24'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  signature: {
    type: Boolean,
    default: false
  },
  supervisorApproval: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  approvalNotes: {
    type: String,
    default: ''
  },
  approved: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  internalExaminers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  externalExaminer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  ideaTitle: {
    type: String,
    required: true,
    trim: true
  },
  ideaDescription: {
    type: String,
    required: true
  },
  supervisorApproval: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  supervisorNotes: {
    type: String,
    default: ''
  },
  coordinatorApproval: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'DEFERRED'],
    default: 'PENDING'
  },
  coordinatorNotes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['IDEA_SUBMITTED', 'INITIAL_APPROVED', 'INTERM1_DONE', 'INTERM2_DONE', 'FINAL_PENDING', 'COMPLETED'],
    default: 'IDEA_SUBMITTED'
  },
  finalGrade: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;

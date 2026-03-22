const mongoose = require('mongoose');

const presentationSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  type: {
    type: String,
    enum: ['INITIAL', 'INTERM1', 'INTERM2', 'FINAL'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'COMPLETED', 'EVALUATED'],
    default: 'SCHEDULED'
  },
  // Track if this presentation has been marked as completed
  completedAt: {
    type: Date,
    default: null
  },
  result: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'DEFERRED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

const Presentation = mongoose.model('Presentation', presentationSchema);

module.exports = Presentation;

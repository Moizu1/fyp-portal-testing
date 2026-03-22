const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  presentationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Presentation',
    required: false  // Not required for supervisors (they evaluate groups, not presentations)
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  examinerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examinerRole: {
    type: String,
    enum: ['supervisor', 'internal1', 'internal2', 'external'],
    required: true
  },
  // Remarks submission (for all examiners on all applicable presentations)
  remarks: {
    type: String,
    default: ''
  },
  remarksSubmittedAt: {
    type: Date,
    default: null
  },
  // Final marks submission (separate from remarks)
  marks: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  marksSubmittedAt: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for finding evaluations by presentation and examiner
evaluationSchema.index({ presentationId: 1, examinerId: 1 });
evaluationSchema.index({ groupId: 1, examinerRole: 1 });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation;

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateName: { type: String },
  candidateEmail: { type: String },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: [
      'pending',
      'shortlisted',
      'rejected',
      'interview_scheduled',
      'offer_extended',
      'hired'
    ],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', applicationSchema);

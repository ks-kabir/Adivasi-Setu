const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    unique: true,
    required: true,
    default: () => 'AS-' + new Date().getFullYear() + '-ST-' + Math.floor(10000 + Math.random() * 90000)
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  scholarshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
    default: 'Submitted'
  },
  currentTimelineStage: {
    type: String,
    enum: [
      'Profile Completed',
      'Documents Submitted',
      'Application Submitted',
      'Under Verification',
      'Final Decision',
      'Scholarship Received'
    ],
    default: 'Application Submitted'
  },
  timeline: [{
    stage: {
      type: String,
      enum: [
        'Profile Completed',
        'Documents Submitted',
        'Application Submitted',
        'Under Verification',
        'Final Decision',
        'Scholarship Received'
      ]
    },
    status: {
      type: String,
      enum: ['Completed', 'In Progress', 'Pending', 'Rejected'],
      default: 'Pending'
    },
    completedAt: Date,
    remarks: String
  }],
  documents: [{
    documentType: String,
    fileName: String,
    fileUrl: String,
    status: {
      type: String,
      enum: ['Missing', 'Uploaded', 'Under Verification', 'Verified', 'Rejected'],
      default: 'Uploaded'
    },
    verificationNote: String
  }],
  adminRemarks: {
    type: String,
    default: ''
  },
  matchScoreAtSubmission: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save to auto-fill timeline stages
applicationSchema.pre('save', function(next) {
  if (!this.timeline || this.timeline.length === 0) {
    this.timeline = [
      { stage: 'Profile Completed', status: 'Completed', completedAt: new Date(), remarks: 'Student profile verified with basic criteria' },
      { stage: 'Documents Submitted', status: 'Completed', completedAt: new Date(), remarks: 'Core verification documents submitted' },
      { stage: 'Application Submitted', status: 'Completed', completedAt: new Date(), remarks: 'Application filed online via AdivasiSetu' },
      { stage: 'Under Verification', status: this.status === 'Submitted' ? 'In Progress' : (this.status === 'Draft' ? 'Pending' : 'Completed'), completedAt: this.status !== 'Submitted' && this.status !== 'Draft' ? new Date() : null, remarks: 'Administrative officer desk scrutiny' },
      { stage: 'Final Decision', status: this.status === 'Approved' ? 'Completed' : (this.status === 'Rejected' ? 'Rejected' : 'Pending'), completedAt: (this.status === 'Approved' || this.status === 'Rejected') ? new Date() : null, remarks: this.status === 'Approved' ? 'Approved by Tribal Welfare Board' : (this.status === 'Rejected' ? 'Application rejected' : 'Awaiting committee assessment') },
      { stage: 'Scholarship Received', status: this.status === 'Approved' ? 'Completed' : 'Pending', completedAt: this.status === 'Approved' ? new Date() : null, remarks: this.status === 'Approved' ? 'DBT transfer credited to bank account' : 'Pending final fund disbursement' }
    ];
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    unique: true,
    required: true,
    default: () => 'DOC-' + Math.floor(100000 + Math.random() * 900000)
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  category: {
    type: String,
    enum: ['Identity', 'Academic', 'Category', 'Income', 'Bank', 'Admission'],
    required: true
  },
  documentType: {
    type: String,
    required: true // e.g. "Aadhaar Card", "ST Certificate", "Income Certificate", "Marksheet", "Bank Passbook", "Admission Proof"
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Missing', 'Uploaded', 'Under Verification', 'Verified', 'Rejected'],
    default: 'Uploaded'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Document', documentSchema);

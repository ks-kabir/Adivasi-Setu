const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    required: true,
    default: () => 'STU-' + Math.floor(100000 + Math.random() * 900000)
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalDetails: {
    fullName: { type: String, default: '' },
    dob: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    villageTown: { type: String, default: '' },
    aadhaarNumber: { type: String, default: '' }
  },
  academicDetails: {
    educationLevel: {
      type: String,
      enum: ['Class 9-10 (Pre-Matric)', 'Class 11-12 (Higher Secondary)', 'Diploma / Polytechnic', 'Undergraduate (UG)', 'Postgraduate (PG)', 'M.Phil / Ph.D. / Research', 'Overseas Studies (Master/PhD)', ''],
      default: ''
    },
    course: { type: String, default: '' },
    yearSemester: { type: String, default: '' },
    collegeInstitution: { type: String, default: '' },
    universityBoard: { type: String, default: '' },
    percentageCgpa: { type: Number, default: 0 },
    admissionYear: { type: Number, default: new Date().getFullYear() }
  },
  categoryDetails: {
    category: { type: String, default: 'Scheduled Tribe (ST)' },
    tribalCommunity: { type: String, default: '' }, // e.g. Gond, Santhal, Bhil, Munda, Khasi, Oraon, etc.
    certificateNumber: { type: String, default: '' },
    isStVerified: { type: Boolean, default: false }
  },
  financialDetails: {
    annualFamilyIncome: { type: Number, default: 0 },
    incomeCertificateNumber: { type: String, default: '' },
    bplStatus: { type: String, enum: ['Yes', 'No', ''], default: '' },
    familyOccupation: { type: String, default: '' },
    incomeRange: { type: String, default: '' }
  },
  savedScholarships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship'
  }],
  profileCompletion: {
    type: Number,
    default: 0
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate Profile Completion Percentage
studentSchema.methods.calculateCompletion = function() {
  let score = 0;
  // Personal (25%)
  if (this.personalDetails.fullName && this.personalDetails.dob && this.personalDetails.gender && this.personalDetails.state && this.personalDetails.district) {
    score += 25;
  } else if (this.personalDetails.fullName) {
    score += 10;
  }

  // Academic (25%)
  if (this.academicDetails.educationLevel && this.academicDetails.course && this.academicDetails.percentageCgpa > 0) {
    score += 25;
  } else if (this.academicDetails.educationLevel) {
    score += 10;
  }

  // Category (25%)
  if (this.categoryDetails.category && this.categoryDetails.tribalCommunity && this.categoryDetails.certificateNumber) {
    score += 25;
  } else if (this.categoryDetails.category) {
    score += 10;
  }

  // Financial (25%)
  if (this.financialDetails.annualFamilyIncome > 0 && this.financialDetails.incomeCertificateNumber) {
    score += 25;
  } else if (this.financialDetails.annualFamilyIncome > 0 || this.financialDetails.incomeRange) {
    score += 15;
  }

  this.profileCompletion = Math.min(score, 100);
  return this.profileCompletion;
};

module.exports = mongoose.model('Student', studentSchema);

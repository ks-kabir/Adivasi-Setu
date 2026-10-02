const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  scholarshipId: {
    type: String,
    unique: true,
    required: true,
    default: () => 'SCH-' + Math.floor(1000 + Math.random() * 9000)
  },
  name: {
    type: String,
    required: [true, 'Scholarship name is required'],
    trim: true
  },
  scheme: {
    type: String,
    required: [true, 'Scheme category is required'],
    enum: [
      'Pre-Matric Scholarship',
      'Post-Matric Scholarship',
      'Top Class Scholarship',
      'NFST',
      'National Overseas Scholarship'
    ]
  },
  provider: {
    type: String,
    required: [true, 'Provider name is required'],
    default: 'Ministry of Tribal Affairs, Government of India'
  },
  providerType: {
    type: String,
    default: 'Central Government'
  },
  description: {
    type: String,
    required: true
  },
  eligibility: {
    category: {
      type: [String],
      default: ['Scheduled Tribe (ST)']
    },
    educationLevels: {
      type: [String],
      default: []
    },
    courses: {
      type: [String],
      default: []
    },
    maxFamilyIncome: {
      type: Number,
      default: 250000 // In INR per annum
    },
    minPercentage: {
      type: Number,
      default: 50
    },
    eligibleStates: {
      type: [String],
      default: ['All India']
    },
    minAge: { type: Number, default: 0 },
    maxAge: { type: Number, default: 35 },
    gender: {
      type: String,
      enum: ['All', 'Female Only', 'Male Only'],
      default: 'All'
    },
    otherConditions: {
      type: [String],
      default: []
    }
  },
  benefits: {
    amount: {
      type: String,
      required: true
    },
    amountPerYear: {
      type: Number,
      default: 0
    },
    duration: {
      type: String,
      default: 'Per Academic Year'
    },
    description: {
      type: String,
      default: ''
    },
    allowances: {
      type: [String],
      default: []
    }
  },
  documents: {
    type: [String],
    default: ['Aadhaar Card', 'ST Community Certificate', 'Income Certificate', 'Previous Year Marksheet', 'Bank Passbook Copy', 'Current Admission Proof']
  },
  deadline: {
    type: Date,
    required: true
  },
  openingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Upcoming', 'Disabled'],
    default: 'Active'
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  totalSlots: {
    type: Number,
    default: 1000
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

module.exports = mongoose.model('Scholarship', scholarshipSchema);

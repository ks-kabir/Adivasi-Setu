const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Scholarship = require('../models/Scholarship');
const Student = require('../models/Student');
const Document = require('../models/Document');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { evaluateEligibility } = require('../services/eligibilityEngine');

// Helper to optionally get current user from token without blocking guests
const getOptionalUser = async (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'adivasisetu_super_secret_jwt_key_2026_tribal_welfare');
      return await User.findById(decoded.id);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// @route   GET /api/scholarships
// @desc    Get all scholarships with search, multi-filter, and match scores
router.get('/', async (req, res) => {
  try {
    const {
      q,
      scheme,
      educationLevel,
      maxIncome,
      state,
      gender,
      providerType,
      status,
      sort
    } = req.query;

    const query = {};

    // By default, show Active schemes unless specified
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'Disabled' };
    }

    if (scheme && scheme !== 'All') {
      query.scheme = scheme;
    }

    if (gender && gender !== 'All') {
      query['eligibility.gender'] = { $in: ['All', gender] };
    }

    if (maxIncome && Number(maxIncome) > 0) {
      query['eligibility.maxFamilyIncome'] = { $gte: Number(maxIncome) };
    }

    if (q) {
      const regex = new RegExp(q, 'i');
      query.$or = [
        { name: regex },
        { description: regex },
        { provider: regex },
        { scheme: regex }
      ];
    }

    if (educationLevel && educationLevel !== 'All') {
      query['eligibility.educationLevels'] = { $in: [new RegExp(educationLevel, 'i'), 'All'] };
    }

    if (state && state !== 'All') {
      query['eligibility.eligibleStates'] = { $in: [new RegExp(state, 'i'), 'All India'] };
    }

    let sortOption = { deadline: 1 };
    if (sort === 'amount-high') {
      sortOption = { 'benefits.amountPerYear': -1 };
    } else if (sort === 'amount-low') {
      sortOption = { 'benefits.amountPerYear': 1 };
    } else if (sort === 'deadline-soon') {
      sortOption = { deadline: 1 };
    } else if (sort === 'popular') {
      sortOption = { applicationCount: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const scholarships = await Scholarship.find(query).sort(sortOption);

    // Optional user matching
    const optionalUser = await getOptionalUser(req);
    let student = null;
    let documents = [];

    if (optionalUser && optionalUser.role === 'student') {
      student = await Student.findOne({ userId: optionalUser._id });
      if (student) {
        documents = await Document.find({ studentId: student._id });
      }
    }

    const result = scholarships.map(sch => {
      const schObj = sch.toObject();
      if (student) {
        const evalResult = evaluateEligibility(student, sch, documents);
        schObj.matchScore = evalResult.matchScore;
        schObj.matchCategory = evalResult.matchCategory;
        schObj.breakdown = evalResult.breakdown;
        schObj.missingRequirements = evalResult.missingRequirements;
        schObj.isSaved = student.savedScholarships?.some(id => id.toString() === sch._id.toString());
      } else {
        schObj.matchScore = null;
        schObj.matchCategory = null;
        schObj.isSaved = false;
      }
      return schObj;
    });

    // If user logged in and sorted by match
    if (student && sort === 'match') {
      result.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    res.json({
      success: true,
      count: result.length,
      scholarships: result
    });
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/scholarships/:id
// @desc    Get single scholarship with comprehensive details & match breakdown
router.get('/:id', async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found.' });
    }

    const schObj = scholarship.toObject();

    // Check if user is logged in
    const optionalUser = await getOptionalUser(req);
    if (optionalUser && optionalUser.role === 'student') {
      const student = await Student.findOne({ userId: optionalUser._id });
      if (student) {
        const documents = await Document.find({ studentId: student._id });
        const evalResult = evaluateEligibility(student, scholarship, documents);
        schObj.matchScore = evalResult.matchScore;
        schObj.matchCategory = evalResult.matchCategory;
        schObj.breakdown = evalResult.breakdown;
        schObj.missingRequirements = evalResult.missingRequirements;
        schObj.actionItems = evalResult.actionItems;
        schObj.isSaved = student.savedScholarships?.some(id => id.toString() === scholarship._id.toString());
        schObj.studentProfileReady = student.profileCompletion >= 50;
      }
    }

    res.json({ success: true, scholarship: schObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/scholarships (Admin only)
// @desc    Add a new scholarship scheme
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const scholarship = await Scholarship.create(req.body);
    res.status(201).json({
      success: true,
      message: 'New scholarship scheme created successfully!',
      scholarship
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/scholarships/:id (Admin only)
// @desc    Update scholarship details
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found.' });
    }
    res.json({
      success: true,
      message: 'Scholarship updated successfully!',
      scholarship
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/scholarships/:id/status (Admin only)
// @desc    Toggle or update scholarship status (Active, Closed, Disabled)
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found.' });
    }
    res.json({
      success: true,
      message: `Scholarship status updated to ${status}.`,
      scholarship
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/scholarships/:id (Admin only)
// @desc    Delete a scholarship scheme
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndDelete(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found.' });
    }
    res.json({ success: true, message: 'Scholarship deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

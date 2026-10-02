const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { evaluateEligibility } = require('../services/eligibilityEngine');

// @route   GET /api/students/profile
// @desc    Get current student profile
router.get('/profile', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate('savedScholarships');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/students/profile
// @desc    Update student profile details (personal, academic, category, financial)
router.put('/profile', protect, async (req, res) => {
  try {
    let student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { personalDetails, academicDetails, categoryDetails, financialDetails } = req.body;

    if (personalDetails) {
      student.personalDetails = { ...student.personalDetails.toObject(), ...personalDetails };
    }
    if (academicDetails) {
      student.academicDetails = { ...student.academicDetails.toObject(), ...academicDetails };
    }
    if (categoryDetails) {
      student.categoryDetails = { ...student.categoryDetails.toObject(), ...categoryDetails };
    }
    if (financialDetails) {
      student.financialDetails = { ...student.financialDetails.toObject(), ...financialDetails };
    }

    student.calculateCompletion();
    student.updatedAt = new Date();
    await student.save();

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/students/onboarding
// @desc    Complete 5-step onboarding wizard
router.post('/onboarding', protect, async (req, res) => {
  try {
    let student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { personalDetails, academicDetails, categoryDetails, financialDetails } = req.body;

    if (personalDetails) student.personalDetails = personalDetails;
    if (academicDetails) student.academicDetails = academicDetails;
    if (categoryDetails) student.categoryDetails = categoryDetails;
    if (financialDetails) student.financialDetails = financialDetails;

    student.onboardingCompleted = true;
    student.calculateCompletion();
    student.updatedAt = new Date();
    await student.save();

    res.json({
      success: true,
      message: 'Onboarding completed successfully!',
      student,
      redirect: '/dashboard.html'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/students/dashboard-summary
// @desc    Aggregated dashboard stats and recommendations for student
router.get('/dashboard-summary', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate('savedScholarships');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Get user applications
    const applications = await Application.find({ studentId: student._id })
      .populate('scholarshipId')
      .sort({ updatedAt: -1 });

    // Get uploaded documents
    const documents = await Document.find({ studentId: student._id });
    const verifiedDocsCount = documents.filter(d => d.status === 'Verified').length;
    const pendingDocsCount = documents.filter(d => d.status === 'Under Verification' || d.status === 'Uploaded').length;

    // Get active scholarships & calculate match scores
    const allScholarships = await Scholarship.find({ status: 'Active' });
    const evaluatedScholarships = allScholarships.map(sch => {
      const evalResult = evaluateEligibility(student, sch, documents);
      return {
        ...sch.toObject(),
        matchScore: evalResult.matchScore,
        matchCategory: evalResult.matchCategory,
        breakdown: evalResult.breakdown,
        missingRequirements: evalResult.missingRequirements,
        actionItems: evalResult.actionItems
      };
    });

    // Sort by match score descending
    evaluatedScholarships.sort((a, b) => b.matchScore - a.matchScore);

    const eligibleCount = evaluatedScholarships.filter(s => s.matchScore >= 50).length;
    const highlyMatched = evaluatedScholarships.filter(s => s.matchCategory === 'Highly Matched');

    // Recent notifications
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    const unreadNotifCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    // Calculate core journey progress (1 to 6)
    // Journey: Discover(1) -> Check Eligibility(2) -> Verify Docs(3) -> Apply(4) -> Track(5) -> Receive(6)
    let currentJourneyStage = 1;
    if (applications.some(a => a.status === 'Approved')) {
      currentJourneyStage = 6;
    } else if (applications.length > 0) {
      currentJourneyStage = 5;
    } else if (documents.length >= 3) {
      currentJourneyStage = 4;
    } else if (student.profileCompletion >= 50) {
      currentJourneyStage = 3;
    } else {
      currentJourneyStage = 2;
    }

    res.json({
      success: true,
      student,
      stats: {
        profileCompletion: student.profileCompletion,
        eligibleScholarshipsCount: eligibleCount,
        applicationsCount: applications.length,
        verifiedDocsCount,
        pendingDocsCount,
        unreadNotifCount,
        currentJourneyStage
      },
      recommendedScholarships: evaluatedScholarships.slice(0, 3),
      applicationsOverview: applications.slice(0, 4),
      recentNotifications: notifications,
      upcomingDeadlines: evaluatedScholarships
        .filter(s => new Date(s.deadline) > new Date())
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 3)
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/students/save-scholarship/:id
// @desc    Save or unsave a scholarship
router.post('/save-scholarship/:id', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const schId = req.params.id;
    const isSaved = student.savedScholarships.some(id => id.toString() === schId);

    if (isSaved) {
      student.savedScholarships = student.savedScholarships.filter(id => id.toString() !== schId);
      await student.save();
      return res.json({ success: true, saved: false, message: 'Scholarship removed from saved list.' });
    } else {
      student.savedScholarships.push(schId);
      await student.save();
      return res.json({ success: true, saved: true, message: 'Scholarship saved to your bookmarks!' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

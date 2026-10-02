const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Student = require('../models/Student');
const Scholarship = require('../models/Scholarship');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const { notifyApplicationStatusChange, createNotification } = require('../services/notificationService');
const { evaluateEligibility } = require('../services/eligibilityEngine');

// @route   GET /api/applications
// @desc    Get applications (student sees own, admin sees all or filtered)
router.get('/', protect, async (req, res) => {
  try {
    const { status, scheme, studentId, search } = req.query;
    let query = {};

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }
      query.studentId = student._id;
    } else if (studentId) {
      query.studentId = studentId;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    let applications = await Application.find(query)
      .populate('scholarshipId')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .sort({ updatedAt: -1 });

    if (scheme && scheme !== 'All') {
      applications = applications.filter(app => app.scholarshipId?.scheme === scheme);
    }

    if (search) {
      const s = search.toLowerCase();
      applications = applications.filter(app =>
        app.applicationId.toLowerCase().includes(s) ||
        app.scholarshipId?.name?.toLowerCase().includes(s) ||
        app.studentId?.personalDetails?.fullName?.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/applications/:id
// @desc    Get single application details with tracker timeline & documents
router.get('/:id', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('scholarshipId')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // If student, ensure they own it
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (application.studentId._id.toString() !== student._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access unauthorized.' });
      }
    }

    // Fetch student's documents
    const studentDocuments = await Document.find({ studentId: application.studentId._id });

    res.json({
      success: true,
      application,
      studentDocuments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/applications
// @desc    Apply for a scholarship (Creates application & starts tracking)
router.post('/', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { scholarshipId } = req.body;
    if (!scholarshipId) {
      return res.status(400).json({ success: false, message: 'Scholarship ID is required.' });
    }

    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship scheme not found.' });
    }

    // Check if scholarship is active
    if (scholarship.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'This scholarship scheme is currently not accepting applications.' });
    }

    // Check if already applied
    const existing = await Application.findOne({
      studentId: student._id,
      scholarshipId: scholarship._id,
      status: { $in: ['Submitted', 'Under Review', 'Approved'] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You have already applied for this scholarship (${existing.applicationId}). Current status: ${existing.status}.`
      });
    }

    // Validate profile requirements
    if (student.profileCompletion < 50) {
      return res.status(400).json({
        success: false,
        message: 'Your student profile is incomplete. Please complete at least 50% of your profile before applying.',
        redirect: '/onboarding.html'
      });
    }

    // Fetch documents
    const documents = await Document.find({ studentId: student._id });

    // Evaluate eligibility score at submission
    const evalResult = evaluateEligibility(student, scholarship, documents);

    // Prepare submitted documents snapshot
    const docSnapshots = documents.map(d => ({
      documentType: d.documentType,
      fileName: d.originalName,
      fileUrl: d.fileUrl,
      status: d.status,
      verificationNote: d.rejectionReason || ''
    }));

    // Create Application with 6-stage timeline
    const now = new Date();
    const application = new Application({
      studentId: student._id,
      scholarshipId: scholarship._id,
      status: 'Submitted',
      currentTimelineStage: 'Under Verification',
      matchScoreAtSubmission: evalResult.matchScore,
      documents: docSnapshots,
      adminRemarks: 'Application received online. Desk scrutiny initiated.',
      timeline: [
        {
          stage: 'Profile Completed',
          status: 'Completed',
          completedAt: now,
          remarks: `Student profile completed (${student.profileCompletion}% completeness)`
        },
        {
          stage: 'Documents Submitted',
          status: 'Completed',
          completedAt: now,
          remarks: `${documents.length} verification documents attached`
        },
        {
          stage: 'Application Submitted',
          status: 'Completed',
          completedAt: now,
          remarks: `Application filed with platform match score of ${evalResult.matchScore}% (${evalResult.matchCategory})`
        },
        {
          stage: 'Under Verification',
          status: 'In Progress',
          completedAt: null,
          remarks: 'Desk scrutiny by Welfare Inspection Team'
        },
        {
          stage: 'Final Decision',
          status: 'Pending',
          completedAt: null,
          remarks: 'Awaiting Tribal Welfare Board review'
        },
        {
          stage: 'Scholarship Received',
          status: 'Pending',
          completedAt: null,
          remarks: 'Direct Benefit Transfer (DBT) to bank account upon sanction'
        }
      ]
    });

    await application.save();

    // Increment scholarship application count
    scholarship.applicationCount = (scholarship.applicationCount || 0) + 1;
    await scholarship.save();

    // Student notification
    await createNotification({
      userId: req.user._id,
      title: `Application Filed: ${application.applicationId}`,
      message: `Your application for "${scholarship.name}" has been successfully submitted and is now under verification.`,
      type: 'Applications',
      badgeText: 'Submitted',
      link: `/application-details.html?id=${application._id}`
    });

    res.status(201).json({
      success: true,
      message: `Application submitted successfully! Application ID: ${application.applicationId}`,
      applicationId: application.applicationId,
      application
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/applications/:id/status (Admin or simulated verification)
// @desc    Update application status (Under Review, Approved, Rejected, Action Required)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, adminRemarks, stage } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('scholarshipId')
      .populate('studentId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (status) {
      application.status = status;
    }
    if (adminRemarks) {
      application.adminRemarks = adminRemarks;
    }

    const now = new Date();

    // Update 6-stage timeline according to status
    if (status === 'Under Review') {
      application.currentTimelineStage = 'Under Verification';
      const stageIdx = application.timeline.findIndex(t => t.stage === 'Under Verification');
      if (stageIdx !== -1) {
        application.timeline[stageIdx].status = 'In Progress';
        application.timeline[stageIdx].remarks = adminRemarks || 'Desk scrutiny and certificate validation ongoing.';
      }
    } else if (status === 'Approved') {
      application.currentTimelineStage = 'Scholarship Received';
      // Mark Under Verification completed
      const verIdx = application.timeline.findIndex(t => t.stage === 'Under Verification');
      if (verIdx !== -1) {
        application.timeline[verIdx].status = 'Completed';
        application.timeline[verIdx].completedAt = now;
      }
      // Mark Final Decision completed
      const decIdx = application.timeline.findIndex(t => t.stage === 'Final Decision');
      if (decIdx !== -1) {
        application.timeline[decIdx].status = 'Completed';
        application.timeline[decIdx].completedAt = now;
        application.timeline[decIdx].remarks = 'Approved by State Tribal Welfare Board.';
      }
      // Mark Scholarship Received
      const recIdx = application.timeline.findIndex(t => t.stage === 'Scholarship Received');
      if (recIdx !== -1) {
        application.timeline[recIdx].status = 'Completed';
        application.timeline[recIdx].completedAt = now;
        application.timeline[recIdx].remarks = adminRemarks || 'Sanction Order released. DBT disbursed to Aadhaar-seeded bank account.';
      }
    } else if (status === 'Rejected') {
      application.currentTimelineStage = 'Final Decision';
      const decIdx = application.timeline.findIndex(t => t.stage === 'Final Decision');
      if (decIdx !== -1) {
        application.timeline[decIdx].status = 'Rejected';
        application.timeline[decIdx].completedAt = now;
        application.timeline[decIdx].remarks = adminRemarks || 'Application rejected by Welfare Board.';
      }
    }

    application.updatedAt = now;
    await application.save();

    // Trigger notification to student
    if (application.studentId && application.studentId.userId) {
      await notifyApplicationStatusChange(application.studentId.userId, application);
    }

    res.json({
      success: true,
      message: `Application ${application.applicationId} status updated to ${status}.`,
      application
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

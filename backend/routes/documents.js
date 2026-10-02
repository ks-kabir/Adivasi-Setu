const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const { notifyDocumentStatusChange } = require('../services/notificationService');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'DOC-' + uniqueSuffix + ext);
  }
});

// File filter: PDF, JPG, PNG only, max 5MB
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, JPG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter
});

// @route   GET /api/documents
// @desc    Get all documents of the current student
router.get('/', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const documents = await Document.find({ studentId: student._id }).sort({ uploadedAt: -1 });

    // Define standard 6 required categories
    const standardCategories = [
      { category: 'Identity', defaultType: 'Aadhaar Card', label: 'Identity Proof (Aadhaar)' },
      { category: 'Category', defaultType: 'ST Community Certificate', label: 'ST Community / Tribe Certificate' },
      { category: 'Income', defaultType: 'Income Certificate', label: 'Annual Family Income Certificate' },
      { category: 'Academic', defaultType: 'Previous Year Marksheet', label: 'Academic Marksheet / Transcript' },
      { category: 'Bank', defaultType: 'Bank Details', label: 'Bank Passbook (Aadhaar Seeded)' },
      { category: 'Admission', defaultType: 'Admission Proof', label: 'Bonafide / Admission Receipt' }
    ];

    res.json({
      success: true,
      documents,
      standardCategories
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/documents/upload
// @desc    Upload or replace a student document
router.post('/upload', protect, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File is too large. Maximum allowed size is 5 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      const { category, documentType, replaceDocId } = req.body;

      if (!category || !documentType) {
        return res.status(400).json({ success: false, message: 'Document category and document type are required.' });
      }

      let doc;

      // If replacing an existing document or re-uploading rejected document
      if (replaceDocId) {
        doc = await Document.findOne({ _id: replaceDocId, studentId: student._id });
      } else {
        // Check if a document of same category & type already exists
        doc = await Document.findOne({
          studentId: student._id,
          category,
          documentType
        });
      }

      if (doc) {
        // Update existing record
        doc.fileName = req.file.filename;
        doc.originalName = req.file.originalname;
        doc.fileUrl = `/uploads/${req.file.filename}`;
        doc.fileSize = req.file.size;
        doc.mimeType = req.file.mimetype;
        doc.status = 'Under Verification'; // Re-triggers verification
        doc.rejectionReason = '';
        doc.uploadedAt = new Date();
        await doc.save();
      } else {
        // Create new document
        doc = await Document.create({
          studentId: student._id,
          category,
          documentType,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileUrl: `/uploads/${req.file.filename}`,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          status: 'Under Verification',
          uploadedAt: new Date()
        });
      }

      res.status(201).json({
        success: true,
        message: `"${documentType}" uploaded successfully. It is now queued for verification.`,
        document: doc
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
});

// @route   PATCH /api/documents/:id/status
// @desc    Simulate/manage verification status (Verified, Rejected, Under Verification)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    doc.status = status;
    if (status === 'Verified') {
      doc.verifiedAt = new Date();
      doc.rejectionReason = '';
    } else if (status === 'Rejected') {
      doc.rejectionReason = rejectionReason || 'Document is unclear, blurry, or missing government seal.';
      doc.verifiedAt = null;
    }
    await doc.save();

    // Notify student
    const student = await Student.findById(doc.studentId);
    if (student) {
      await notifyDocumentStatusChange(student.userId, doc.documentType, status, doc.rejectionReason);
    }

    res.json({
      success: true,
      message: `Document status changed to ${status}.`,
      document: doc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document
router.delete('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const doc = await Document.findOne({ _id: req.params.id, studentId: student._id });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Try deleting file from disk
    const filePath = path.join(uploadDir, doc.fileName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }

    await doc.deleteOne();
    res.json({ success: true, message: 'Document removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

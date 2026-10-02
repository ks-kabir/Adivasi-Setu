const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'adivasisetu_super_secret_jwt_key_2026_tribal_welfare', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new student account
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      dob,
      gender,
      mobile,
      email,
      state,
      district,
      villageTown,
      password,
      terms
    } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all mandatory fields (Name, Email, Mobile, Password).' });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please login.' });
    }

    // Create User
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: mobile,
      password,
      role: 'student'
    });

    // Create associated Student profile
    const student = new Student({
      userId: user._id,
      personalDetails: {
        fullName: name,
        dob: dob || '',
        gender: gender || '',
        mobile: mobile,
        email: email.toLowerCase(),
        state: state || '',
        district: district || '',
        villageTown: villageTown || ''
      },
      academicDetails: {},
      categoryDetails: {
        category: 'Scheduled Tribe (ST)'
      },
      financialDetails: {},
      onboardingCompleted: false
    });
    student.calculateCompletion();
    await student.save();

    // Welcome notification
    await createNotification({
      userId: user._id,
      title: 'Welcome to AdivasiSetu!',
      message: 'Your account is active. Complete your 5-step profile to unlock automatic scholarship eligibility matching.',
      type: 'JAGO',
      badgeText: 'New Account',
      link: '/onboarding.html'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to AdivasiSetu.',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      },
      studentId: student._id,
      profileCompletion: student.profileCompletion,
      redirect: '/onboarding.html'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body; // loginId can be email or phone

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Email/Mobile and Password.' });
    }

    // Find by email or phone
    const user = await User.findOne({
      $or: [
        { email: loginId.trim().toLowerCase() },
        { phone: loginId.trim() }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. No user found with this email or mobile.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password does not match.' });
    }

    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({ userId: user._id });
    }

    const token = generateToken(user._id);

    const redirect = user.role === 'admin'
      ? '/admin.html'
      : (studentProfile && studentProfile.onboardingCompleted ? '/dashboard.html' : '/onboarding.html');

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      },
      student: studentProfile,
      redirect
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// @route   POST /api/auth/demo-login
// @desc    Instant 1-click test login for evaluators
router.post('/demo-login', async (req, res) => {
  try {
    const { role = 'student' } = req.body;
    const targetEmail = role === 'admin' ? 'admin@adivasisetu.in' : 'student@adivasisetu.in';

    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: `Demo ${role} user not found. Please run seed script.` });
    }

    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({ userId: user._id });
    }

    const token = generateToken(user._id);
    const redirect = user.role === 'admin' ? '/admin.html' : '/dashboard.html';

    res.json({
      success: true,
      message: `Signed in as Demo ${user.role.toUpperCase()}: ${user.name}`,
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      },
      student: studentProfile,
      redirect
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user & student details
router.get('/me', protect, async (req, res) => {
  try {
    let student = null;
    if (req.user.role === 'student') {
      student = await Student.findOne({ userId: req.user._id });
    }

    res.json({
      success: true,
      user: req.user,
      student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new password.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating password.' });
  }
});

module.exports = router;

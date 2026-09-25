const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Default role validation
    const allowedRoles = ['renter', 'host'];
    const assignedRole = allowedRoles.includes(role) ? role : 'renter';

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      phone: phone || '',
      kycStatus: 'unverified',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        kycStatus: user.kycStatus,
        phone: user.phone,
        bio: user.bio,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during registration',
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        kycStatus: user.kycStatus,
        phone: user.phone,
        bio: user.bio,
        rating: user.rating,
        totalTrips: user.totalTrips,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during login',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error fetching user profile',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error updating profile',
    });
  }
};

// @desc    Submit KYC Verification
// @route   POST /api/auth/kyc
// @access  Private
exports.submitKYC = async (req, res) => {
  try {
    const { idType, idNumber, driverLicenseNumber, documentImage } = req.body;
    const user = await User.findById(req.user.id);

    user.kycStatus = 'pending';
    user.driverLicenseNumber = driverLicenseNumber || idNumber || user.driverLicenseNumber;
    user.kycDocuments = {
      idType: idType || 'Driver License',
      idNumber: idNumber || driverLicenseNumber || '',
      documentImage: documentImage || (req.file ? `/uploads/${req.file.filename}` : '/uploads/id_placeholder.jpg'),
      submittedAt: new Date(),
      rejectionReason: '',
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Identity documents submitted for Agency verification!',
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error submitting KYC documents',
    });
  }
};

// @desc    Switch user role (convenience for testing host & renter portals)
// @route   POST /api/auth/switch-role
// @access  Private
exports.switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['renter', 'host', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only an existing admin can use the admin portal.' });
    }
    if (req.user.role === 'admin' && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'The admin account cannot switch to a customer role.' });
    }

    const user = await User.findById(req.user.id);
    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Role switched to ${role}`,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

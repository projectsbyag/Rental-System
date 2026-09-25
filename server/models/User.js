const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['renter', 'host', 'admin'],
    default: 'renter',
  },
  phone: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  },
  bio: {
    type: String,
    default: 'P2P car rental enthusiast.',
  },
  // Intermediary Verification Fields
  kycStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified',
  },
  kycDocuments: {
    idType: { type: String, default: 'Driver License' },
    idNumber: { type: String, default: '' },
    documentImage: { type: String, default: '' },
    submittedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
  },
  driverLicenseNumber: {
    type: String,
    default: '',
  },
  licenseExpiry: {
    type: Date,
  },
  rating: {
    type: Number,
    default: 5.0,
  },
  totalTrips: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

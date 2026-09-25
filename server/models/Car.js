const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a car title'],
    trim: true,
  },
  make: {
    type: String,
    required: [true, 'Please provide the make (e.g. Tesla, BMW)'],
    trim: true,
  },
  model: {
    type: String,
    required: [true, 'Please provide the model (e.g. Model 3, M4)'],
    trim: true,
  },
  year: {
    type: Number,
    required: [true, 'Please provide the manufacture year'],
    min: 2000,
    max: 2030,
  },
  category: {
    type: String,
    required: true,
    enum: ['SUV', 'Sedan', 'Electric', 'Luxury', 'Sports', 'Compact'],
  },
  transmission: {
    type: String,
    required: true,
    enum: ['Automatic', 'Manual'],
    default: 'Automatic',
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['Electric', 'Hybrid', 'Petrol', 'Diesel'],
    default: 'Petrol',
  },
  seats: {
    type: Number,
    required: true,
    min: 2,
    max: 9,
    default: 5,
  },
  doors: {
    type: Number,
    default: 4,
  },
  dailyRate: {
    type: Number,
    required: [true, 'Please set a daily rental price'],
    min: 15,
  },
  securityDeposit: {
    type: Number,
    default: 200,
  },
  mileageLimitPerDay: {
    type: Number,
    default: 200, // miles or km per day, 0 for unlimited
  },
  location: {
    address: { type: String, default: 'Downtown Metropark' },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: 'CA' },
    country: { type: String, default: 'USA' },
  },
  images: [{
    type: String,
    required: true,
  }],
  features: [{
    type: String,
  }],
  specs: {
    horsepower: { type: Number, default: 300 },
    acceleration: { type: String, default: '4.5s (0-60 mph)' },
    fuelEconomyOrRange: { type: String, default: '330 mi' },
    topSpeed: { type: String, default: '155 mph' },
  },
  description: {
    type: String,
    default: 'Immaculately maintained vehicle ready for your journey.',
  },
  // Intermediary Verification Fields
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved', // seeded or host submitted
  },
  vehicleRegistrationNumber: {
    type: String,
    default: '',
  },
  insurancePolicyNumber: {
    type: String,
    default: '',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 5.0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  tripCount: {
    type: Number,
    default: 0,
  },
  blockedDates: [{
    startDate: { type: Date },
    endDate: { type: Date },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for high-performance text and location search
carSchema.index({ 'location.city': 'text', make: 'text', model: 'text', title: 'text' });

module.exports = mongoose.model('Car', carSchema);

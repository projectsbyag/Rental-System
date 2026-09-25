const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true,
  },
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  totalDays: {
    type: Number,
    required: true,
    min: 1,
  },
  dailyRate: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  serviceFee: {
    type: Number,
    required: true, // Intermediary agency commission
  },
  insuranceFee: {
    type: Number,
    default: 15,
  },
  securityDeposit: {
    type: Number,
    default: 200,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'escrow_held', 'released_to_host', 'refunded'],
    default: 'escrow_held',
  },
  // Trip Handover / Inspection
  handoverDetails: {
    pickupOdometer: { type: Number, default: 0 },
    returnOdometer: { type: Number, default: 0 },
    pickupFuelLevel: { type: String, default: '100%' },
    returnFuelLevel: { type: String, default: '100%' },
    pickupNotes: { type: String, default: '' },
    returnNotes: { type: String, default: '' },
    pickupConfirmedAt: { type: Date },
    returnConfirmedAt: { type: Date },
  },
  hasReview: {
    type: Boolean,
    default: false,
  },
  cancellationReason: {
    type: String,
    default: '',
  },
  dispute: {
    isDisputed: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['none', 'open', 'resolved'], default: 'none' },
    resolutionNotes: { type: String, default: '' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);

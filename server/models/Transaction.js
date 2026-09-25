const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['booking_payment', 'host_payout', 'refund', 'agency_commission'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'NGN',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
  },
  description: {
    type: String,
    default: '',
  },
  paymentMethod: {
    type: String,
    default: 'Digital Wallet / Card',
  },
  referenceId: {
    type: String,
    default: () => 'TX-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);

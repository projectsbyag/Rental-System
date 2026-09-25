const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

// @desc    Get Admin Agency Dashboard Metrics
// @route   GET /api/admin/metrics
// @access  Private (Admin)
exports.getMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $in: ['renter', 'host'] } });
    const totalRenters = await User.countDocuments({ role: 'renter' });
    const totalHosts = await User.countDocuments({ role: 'host' });
    const pendingKYC = await User.countDocuments({ kycStatus: 'pending' });

    const totalCars = await Car.countDocuments();
    const approvedCars = await Car.countDocuments({ verificationStatus: 'approved' });
    const pendingCars = await Car.countDocuments({ verificationStatus: 'pending' });

    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const activeBookings = await Booking.countDocuments({ status: 'active' });
    const openDisputes = await Booking.countDocuments({ 'dispute.status': 'open' });

    // Financial aggregates
    const bookings = await Booking.find();
    let totalGMV = 0;
    let totalAgencyCommission = 0;
    let escrowHeld = 0;

    bookings.forEach((b) => {
      totalGMV += b.totalAmount || 0;
      totalAgencyCommission += b.serviceFee || 0;
      if (b.paymentStatus === 'escrow_held') {
        escrowHeld += b.totalAmount || 0;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRenters,
        totalHosts,
        pendingKYC,
        totalCars,
        approvedCars,
        pendingCars,
        totalBookings,
        completedBookings,
        activeBookings,
        openDisputes,
        totalGMV,
        totalAgencyCommission,
        escrowHeld,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Pending User KYC Verifications
// @route   GET /api/admin/kyc-queue
// @access  Private (Admin)
exports.getPendingKYC = async (req, res) => {
  try {
    const users = await User.find({ kycStatus: { $in: ['pending', 'unverified', 'verified', 'rejected'] } })
      .select('-password')
      .sort({ 'kycDocuments.submittedAt': -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Approve or Reject User KYC
// @route   PATCH /api/admin/kyc/:userId
// @access  Private (Admin)
exports.verifyUserKYC = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.kycStatus = status;
    if (status === 'rejected') {
      user.kycDocuments.rejectionReason = rejectionReason || 'Document verification could not be authenticated.';
    } else {
      user.kycDocuments.rejectionReason = '';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User KYC status updated to '${status}'.`,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Pending & All Vehicles Verification Queue
// @route   GET /api/admin/cars-queue
// @access  Private (Admin)
exports.getCarsQueue = async (req, res) => {
  try {
    const cars = await Car.find()
      .populate('host', 'name email phone rating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Approve or Reject Vehicle Listing
// @route   PATCH /api/admin/cars/:carId/verify
// @access  Private (Admin)
exports.verifyCar = async (req, res) => {
  try {
    const { status, rejectionReason, isFeatured } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const car = await Car.findById(req.params.carId).populate('host', 'name email');
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    car.verificationStatus = status;
    if (isFeatured !== undefined) car.isFeatured = isFeatured;
    if (status === 'rejected') {
      car.rejectionReason = rejectionReason || 'Vehicle failed safety or paperwork inspection.';
    } else {
      car.rejectionReason = '';
    }

    await car.save();

    res.status(200).json({
      success: true,
      message: `Vehicle verification status updated to '${status}'.`,
      data: car,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all bookings across the platform
// @route   GET /api/admin/bookings
// @access  Private (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('car')
      .populate('renter', 'name email phone kycStatus')
      .populate('host', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Resolve a Booking Dispute
// @route   PATCH /api/admin/bookings/:id/resolve-dispute
// @access  Private (Admin)
exports.resolveDispute = async (req, res) => {
  try {
    const { resolutionNotes, action } = req.body; // action: 'refund_renter', 'payout_host', 'dismiss'
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.dispute.status = 'resolved';
    booking.dispute.resolutionNotes = resolutionNotes || `Dispute adjudicated by Intermediary Agency with decision: ${action}`;

    if (action === 'refund_renter') {
      booking.paymentStatus = 'refunded';
      await Transaction.create({
        booking: booking._id,
        user: booking.renter,
        type: 'refund',
        amount: booking.totalAmount,
        status: 'completed',
        description: `Dispute resolution refund for booking #${booking._id}`,
      });
    } else if (action === 'payout_host') {
      booking.paymentStatus = 'released_to_host';
      await Transaction.create({
        booking: booking._id,
        user: booking.host,
        type: 'host_payout',
        amount: booking.subtotal,
        status: 'completed',
        description: `Dispute resolution host payout for booking #${booking._id}`,
      });
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Dispute has been successfully resolved and logged.',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all Financial Transactions
// @route   GET /api/admin/transactions
// @access  Private (Admin)
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email role')
      .populate('booking')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

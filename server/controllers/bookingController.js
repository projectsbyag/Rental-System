const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private (Renter)
exports.createBooking = async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.body;

    if (!carId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide car ID, start date, and end date.',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date.',
      });
    }

    const car = await Car.findById(carId).populate('host', 'name email');
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    if (car.host._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own vehicle.',
      });
    }

    if (car.verificationStatus !== 'approved' || !car.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This vehicle is currently not available for rental.',
      });
    }

    // Check for date conflicts
    const conflictingBooking = await Booking.findOne({
      car: car._id,
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This vehicle is already reserved for the selected dates. Please choose another timeframe.',
      });
    }

    // Calculate duration in days (minimum 1 day)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Pricing calculation
    const dailyRate = car.dailyRate;
    const subtotal = dailyRate * diffDays;
    const serviceFee = Math.round(subtotal * 0.15); // 15% Intermediary Agency commission
    const insuranceFee = 15 * diffDays; // $15 per day basic protection
    const securityDeposit = car.securityDeposit || 200;
    const totalAmount = subtotal + serviceFee + insuranceFee + securityDeposit;

    const booking = await Booking.create({
      car: car._id,
      renter: req.user.id,
      host: car.host._id,
      startDate: start,
      endDate: end,
      totalDays: diffDays,
      dailyRate,
      subtotal,
      serviceFee,
      insuranceFee,
      securityDeposit,
      totalAmount,
      status: 'pending',
      paymentStatus: 'escrow_held',
    });

    // Create Escrow Transaction Record
    await Transaction.create({
      booking: booking._id,
      user: req.user.id,
      type: 'booking_payment',
      amount: totalAmount,
      status: 'completed',
      description: `Escrow payment for ${car.year} ${car.make} ${car.model} (${diffDays} days)`,
    });

    // Also record the Agency Commission placeholder
    await Transaction.create({
      booking: booking._id,
      user: req.user.id,
      type: 'agency_commission',
      amount: serviceFee,
      status: 'pending',
      description: `Agency platform fee (15%) for Booking #${booking._id}`,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('car', 'title make model year images category dailyRate location')
      .populate('host', 'name email phone avatar rating')
      .populate('renter', 'name email phone avatar');

    res.status(201).json({
      success: true,
      message: 'Booking request sent! Payment is held in secure intermediary escrow until the host accepts and you check in.',
      data: populatedBooking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error processing booking request',
    });
  }
};

// @desc    Get logged in user's bookings (as Renter)
// @route   GET /api/bookings/my-trips
// @access  Private
exports.getMyTrips = async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user.id })
      .populate('car')
      .populate('host', 'name email phone avatar rating')
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

// @desc    Get bookings for host's vehicles
// @route   GET /api/bookings/host-reservations
// @access  Private (Host)
exports.getHostReservations = async (req, res) => {
  try {
    const bookings = await Booking.find({ host: req.user.id })
      .populate('car')
      .populate('renter', 'name email phone avatar kycStatus rating totalTrips')
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

// @desc    Host Accepts a booking request
// @route   PATCH /api/bookings/:id/accept
// @access  Private (Host)
exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('renter', 'name email');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this booking' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept booking with status '${booking.status}'`,
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking confirmed! The vehicle has been reserved for the renter.',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Host or Renter Rejects / Declines booking
// @route   PATCH /api/bookings/:id/decline
// @access  Private
exports.declineBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isHost = booking.host.toString() === req.user.id;
    const isRenter = booking.renter.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isHost && !isRenter && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.status = isHost ? 'rejected' : 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.cancellationReason = reason || (isHost ? 'Declined by host' : 'Cancelled by renter');
    await booking.save();

    // Create refund transaction record
    await Transaction.create({
      booking: booking._id,
      user: booking.renter,
      type: 'refund',
      amount: booking.totalAmount,
      status: 'completed',
      description: `Refund for ${booking.status} booking #${booking._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Booking has been ${booking.status}. Escrow funds have been refunded to the renter.`,
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Start trip / Key handover
// @route   PATCH /api/bookings/:id/start-trip
// @access  Private (Renter or Host)
exports.startTrip = async (req, res) => {
  try {
    const { pickupOdometer, pickupFuelLevel, pickupNotes } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = 'active';
    booking.handoverDetails.pickupOdometer = Number(pickupOdometer) || 0;
    booking.handoverDetails.pickupFuelLevel = pickupFuelLevel || '100%';
    booking.handoverDetails.pickupNotes = pickupNotes || 'Vehicle handed over in clean condition.';
    booking.handoverDetails.pickupConfirmedAt = new Date();

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Trip officially started! Have a safe journey.',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Complete trip / Return vehicle and release host payout
// @route   PATCH /api/bookings/:id/complete-trip
// @access  Private (Host or Renter)
exports.completeTrip = async (req, res) => {
  try {
    const { returnOdometer, returnFuelLevel, returnNotes } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = 'completed';
    booking.paymentStatus = 'released_to_host';
    booking.handoverDetails.returnOdometer = Number(returnOdometer) || booking.handoverDetails.pickupOdometer + 120;
    booking.handoverDetails.returnFuelLevel = returnFuelLevel || '100%';
    booking.handoverDetails.returnNotes = returnNotes || 'Vehicle returned in great condition.';
    booking.handoverDetails.returnConfirmedAt = new Date();

    await booking.save();

    // Increment trip counts
    await Car.findByIdAndUpdate(booking.car, { $inc: { tripCount: 1 } });
    await User.findByIdAndUpdate(booking.renter, { $inc: { totalTrips: 1 } });
    await User.findByIdAndUpdate(booking.host, { $inc: { totalTrips: 1 } });

    // Host payout amount = subtotal (e.g. dailyRate * days)
    const hostPayout = booking.subtotal;
    await Transaction.create({
      booking: booking._id,
      user: booking.host,
      type: 'host_payout',
      amount: hostPayout,
      status: 'completed',
      description: `Earnings payout for completed trip #${booking._id}`,
    });

    // Refund security deposit back to renter
    await Transaction.create({
      booking: booking._id,
      user: booking.renter,
      type: 'refund',
      amount: booking.securityDeposit,
      status: 'completed',
      description: `Refund of security deposit ($${booking.securityDeposit}) for completed trip #${booking._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Trip marked as completed! Host earnings have been released and security deposit refunded.',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Report dispute / damage
// @route   POST /api/bookings/:id/dispute
// @access  Private
exports.reportDispute = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.dispute = {
      isDisputed: true,
      reason: reason || 'Damage / Inspection dispute raised',
      status: 'open',
      resolutionNotes: 'Under review by Intermediary Agency mediation team.',
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Dispute submitted to Intermediary Agency for mediation and review.',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

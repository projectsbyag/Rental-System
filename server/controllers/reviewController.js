const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');

// @desc    Add review for a completed booking
// @route   POST /api/reviews
// @access  Private (Renter)
exports.addReview = async (req, res) => {
  try {
    const { bookingId, rating, cleanlinessRating, communicationRating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID, rating, and comment.',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.renter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the renter of this trip can leave a review.',
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review a completed trip.',
      });
    }

    if (booking.hasReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this trip.',
      });
    }

    const review = await Review.create({
      booking: booking._id,
      car: booking.car,
      author: req.user.id,
      rating: Number(rating),
      cleanlinessRating: Number(cleanlinessRating) || Number(rating),
      communicationRating: Number(communicationRating) || Number(rating),
      comment,
    });

    booking.hasReview = true;
    await booking.save();

    // Recalculate Car Rating
    const allCarReviews = await Review.find({ car: booking.car });
    const avgCarRating = (
      allCarReviews.reduce((acc, item) => acc + item.rating, 0) / allCarReviews.length
    ).toFixed(1);

    await Car.findByIdAndUpdate(booking.car, {
      rating: Number(avgCarRating),
      reviewCount: allCarReviews.length,
    });

    // Update Host Rating
    const hostCars = await Car.find({ host: booking.host }).select('_id');
    const hostCarIds = hostCars.map((c) => c._id);
    const allHostReviews = await Review.find({ car: { $in: hostCarIds } });
    if (allHostReviews.length > 0) {
      const avgHostRating = (
        allHostReviews.reduce((acc, item) => acc + item.rating, 0) / allHostReviews.length
      ).toFixed(1);
      await User.findByIdAndUpdate(booking.host, { rating: Number(avgHostRating) });
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! Thank you for your feedback.',
      data: review,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all reviews for a car
// @route   GET /api/reviews/car/:carId
// @access  Public
exports.getCarReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ car: req.params.carId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyTrips,
  getHostReservations,
  acceptBooking,
  declineBooking,
  startTrip,
  completeTrip,
  reportDispute,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All booking routes are protected

router.post('/', authorize('renter'), createBooking);
router.get('/my-trips', authorize('renter'), getMyTrips);
router.get('/host-reservations', authorize('host', 'admin'), getHostReservations);
router.patch('/:id/accept', authorize('host', 'admin'), acceptBooking);
router.patch('/:id/decline', authorize('renter', 'host', 'admin'), declineBooking);
router.patch('/:id/start-trip', authorize('renter', 'host', 'admin'), startTrip);
router.patch('/:id/complete-trip', authorize('renter', 'host', 'admin'), completeTrip);
router.post('/:id/dispute', authorize('renter', 'host', 'admin'), reportDispute);

module.exports = router;

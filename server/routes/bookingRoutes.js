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
const { protect } = require('../middleware/auth');

router.use(protect); // All booking routes are protected

router.post('/', createBooking);
router.get('/my-trips', getMyTrips);
router.get('/host-reservations', getHostReservations);
router.patch('/:id/accept', acceptBooking);
router.patch('/:id/decline', declineBooking);
router.patch('/:id/start-trip', startTrip);
router.patch('/:id/complete-trip', completeTrip);
router.post('/:id/dispute', reportDispute);

module.exports = router;

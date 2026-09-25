const express = require('express');
const router = express.Router();
const {
  getMetrics,
  getPendingKYC,
  verifyUserKYC,
  getCarsQueue,
  verifyCar,
  getAllBookings,
  resolveDispute,
  getAllTransactions,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Protect all admin routes & require 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/metrics', getMetrics);
router.get('/kyc-queue', getPendingKYC);
router.patch('/kyc/:userId', verifyUserKYC);
router.get('/cars-queue', getCarsQueue);
router.patch('/cars/:carId/verify', verifyCar);
router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/resolve-dispute', resolveDispute);
router.get('/transactions', getAllTransactions);

module.exports = router;

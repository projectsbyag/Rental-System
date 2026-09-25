const express = require('express');
const router = express.Router();
const {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  getMyCars,
  toggleCarActive,
} = require('../controllers/carController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getCars);
router.get('/my-fleet', protect, authorize('host', 'admin'), getMyCars);
router.get('/:id', getCarById);

// Protected host routes
router.post('/', protect, authorize('host', 'admin'), upload.array('images', 6), createCar);
router.put('/:id', protect, authorize('host', 'admin'), updateCar);
router.delete('/:id', protect, authorize('host', 'admin'), deleteCar);
router.patch('/:id/toggle-active', protect, authorize('host', 'admin'), toggleCarActive);

module.exports = router;

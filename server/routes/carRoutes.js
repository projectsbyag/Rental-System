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
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getCars);
router.get('/my-fleet', protect, getMyCars);
router.get('/:id', getCarById);

// Protected host routes
router.post('/', protect, upload.array('images', 6), createCar);
router.put('/:id', protect, updateCar);
router.delete('/:id', protect, deleteCar);
router.patch('/:id/toggle-active', protect, toggleCarActive);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  submitKYC,
  switchRole,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/kyc', protect, upload.single('documentImage'), submitKYC);
router.post('/switch-role', protect, switchRole);

module.exports = router;

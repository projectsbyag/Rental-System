const express = require('express');
const router = express.Router();
const { addReview, getCarReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/car/:carId', getCarReviews);
router.post('/', protect, addReview);

module.exports = router;

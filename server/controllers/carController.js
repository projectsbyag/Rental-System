const Car = require('../models/Car');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// @desc    Get all cars with filters and search
// @route   GET /api/cars
// @access  Public
exports.getCars = async (req, res) => {
  try {
    const {
      city,
      category,
      minPrice,
      maxPrice,
      transmission,
      fuelType,
      seats,
      sort,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {
      isActive: true,
      verificationStatus: 'approved', // Only verified cars shown to public
    };

    // City / Location filter
    if (city && city.trim()) {
      query['location.city'] = new RegExp(city.trim(), 'i');
    }

    // Keyword Search
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { make: searchRegex },
        { model: searchRegex },
        { 'location.city': searchRegex },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Transmission
    if (transmission && transmission !== 'All') {
      query.transmission = transmission;
    }

    // Fuel Type
    if (fuelType && fuelType !== 'All') {
      query.fuelType = fuelType;
    }

    // Seats
    if (seats) {
      query.seats = { $gte: Number(seats) };
    }

    // Price range
    if (minPrice || maxPrice) {
      query.dailyRate = {};
      if (minPrice) query.dailyRate.$gte = Number(minPrice);
      if (maxPrice) query.dailyRate.$lte = Number(maxPrice);
    }

    // Date Availability check
    if (startDate && endDate) {
      const reqStart = new Date(startDate);
      const reqEnd = new Date(endDate);

      if (!isNaN(reqStart) && !isNaN(reqEnd) && reqStart < reqEnd) {
        // Find cars that have confirmed/active bookings overlapping with these dates
        const conflictingBookings = await Booking.find({
          status: { $in: ['confirmed', 'active', 'pending'] },
          $or: [
            { startDate: { $lt: reqEnd }, endDate: { $gt: reqStart } },
          ],
        }).select('car');

        const bookedCarIds = conflictingBookings.map((b) => b.car);
        if (bookedCarIds.length > 0) {
          query._id = { $nin: bookedCarIds };
        }

        query.blockedDates = {
          $not: {
            $elemMatch: {
              startDate: { $lt: reqEnd },
              endDate: { $gt: reqStart },
            },
          },
        };
      }
    }

    // Sorting
    let sortOption = { isFeatured: -1, rating: -1, createdAt: -1 };
    if (sort === 'price_asc') sortOption = { dailyRate: 1 };
    if (sort === 'price_desc') sortOption = { dailyRate: -1 };
    if (sort === 'rating') sortOption = { rating: -1, reviewCount: -1 };
    if (sort === 'trips') sortOption = { tripCount: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const cars = await Car.find(query)
      .populate('host', 'name avatar rating kycStatus')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error retrieving car listings',
    });
  }
};

// @desc    Get single car details
// @route   GET /api/cars/:id
// @access  Public
exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findOne({
      _id: req.params.id,
      isActive: true,
      verificationStatus: 'approved',
    })
      .populate('host', 'name email phone avatar bio rating totalTrips kycStatus createdAt');

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car listing not found',
      });
    }

    // Fetch reviews for this car
    const reviews = await Review.find({ car: car._id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(15);

    res.status(200).json({
      success: true,
      data: car,
      reviews,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error fetching car details',
    });
  }
};

// @desc    Create new car listing (Host)
// @route   POST /api/cars
// @access  Private (Host/Admin)
exports.createCar = async (req, res) => {
  try {
    if (req.user.kycStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Please complete host verification before listing a vehicle.',
      });
    }

    const carData = { ...req.body, host: req.user.id };

    // Parse features if passed as string/JSON
    if (typeof carData.features === 'string') {
      try {
        carData.features = JSON.parse(carData.features);
      } catch (e) {
        carData.features = carData.features.split(',').map((f) => f.trim());
      }
    }

    // Handle images if uploaded via multer
    if (req.files && req.files.length > 0) {
      carData.images = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (!carData.images || carData.images.length === 0) {
      // Default high quality automotive image if not provided
      carData.images = [
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
      ];
    }

    // By default, newly submitted cars require agency intermediary verification
    carData.verificationStatus = 'pending';

    const car = await Car.create(carData);

    res.status(201).json({
      success: true,
      message: 'Vehicle listed successfully! It has been submitted to the Intermediary Agency for safety and document verification.',
      data: car,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error creating car listing',
    });
  }
};

// @desc    Update car listing
// @route   PUT /api/cars/:id
// @access  Private (Host who owns the car or Admin)
exports.updateCar = async (req, res) => {
  try {
    let car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    // Make sure user is car owner or admin
    if (car.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this listing',
      });
    }

    const updates = { ...req.body };
    if (typeof updates.features === 'string') {
      try { updates.features = JSON.parse(updates.features); } catch (e) {}
    }

    car = await Car.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Car listing updated successfully',
      data: car,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete car listing
// @route   DELETE /api/cars/:id
// @access  Private (Host who owns car or Admin)
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    if (car.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this listing',
      });
    }

    await Car.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Car listing removed',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all cars owned by the logged-in host
// @route   GET /api/cars/my-fleet
// @access  Private (Host)
exports.getMyCars = async (req, res) => {
  try {
    const cars = await Car.find({ host: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle car active availability status
// @route   PATCH /api/cars/:id/toggle-active
// @access  Private (Host)
exports.toggleCarActive = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });

    if (car.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    car.isActive = !car.isActive;
    await car.save();

    res.status(200).json({
      success: true,
      message: `Car listing is now ${car.isActive ? 'active' : 'paused'}`,
      data: car,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

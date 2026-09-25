const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');

const seedDatabase = async () => {
  try {
    console.log('🌱 Checking / Seeding Initial Data...');

    // 1. Check if users exist and recreate if needed
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('✅ Existing data found. Skipping destructive seed reset.');
      return;
    }

    // 1. Create Core Users
    const admin = await User.create({
      name: 'Adaeze Okafor',
      email: 'admin@rentpeer.com',
      password: 'admin123',
      role: 'admin',
      phone: '+234 803 000 0001',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
      bio: 'Operations lead for RentPeer Nigeria. Overseeing vehicle compliance, trust & safety, and host onboarding across major cities.',
      kycStatus: 'verified',
      driverLicenseNumber: 'DL-ADM-994012',
    });

    const host1 = await User.create({
      name: 'Tosin Adebayo',
      email: 'host@rentpeer.com',
      password: 'host123',
      role: 'host',
      phone: '+234 803 000 0002',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80',
      bio: 'Automotive enthusiast and verified Superhost in Lagos. I maintain every vehicle to premium standards for smooth trips.',
      kycStatus: 'verified',
      driverLicenseNumber: 'DL-LAG-8839201',
      rating: 4.95,
      totalTrips: 48,
    });

    const host2 = await User.create({
      name: 'Amina Bello',
      email: 'elena@rentpeer.com',
      password: 'host123',
      role: 'host',
      phone: '+234 803 000 0003',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=250&q=80',
      bio: 'Luxury and EV host serving Abuja, Lagos, and Port Harcourt. Fast responses and premium booking experience.',
      kycStatus: 'verified',
      driverLicenseNumber: 'DL-ABJ-4402918',
      rating: 5.0,
      totalTrips: 32,
    });

    const renter1 = await User.create({
      name: 'Kelechi Nwosu',
      email: 'renter@rentpeer.com',
      password: 'renter123',
      role: 'renter',
      phone: '+234 803 000 0004',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      bio: 'Business traveler and weekend road-trip planner across Nigeria.',
      kycStatus: 'verified',
      driverLicenseNumber: 'DL-RIV-9021844',
      rating: 5.0,
      totalTrips: 8,
    });

    const renter2 = await User.create({
      name: 'Ifeoma Eze',
      email: 'sam@rentpeer.com',
      password: 'renter123',
      role: 'renter',
      phone: '+234 803 000 0005',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      bio: 'Weekend explorer and photography enthusiast passionate about local road trips and city escapes.',
      kycStatus: 'pending',
      driverLicenseNumber: 'DL-OYO-5519283',
      kycDocuments: {
        idType: 'Driver License',
        idNumber: 'DL-OYO-5519283',
        documentImage: '/uploads/id_placeholder.jpg',
        submittedAt: new Date(Date.now() - 3600000 * 4),
      },
      rating: 4.8,
      totalTrips: 2,
    });

    console.log('✅ Seeded Users: Admin, Hosts, Renters.');

    // 2. Create Vehicle Fleet
    const carsData = [
      {
        host: host1._id,
        title: '2024 Tesla Model Y Performance AWD',
        make: 'Tesla',
        model: 'Model Y Performance',
        year: 2024,
        category: 'Electric',
        transmission: 'Automatic',
        fuelType: 'Electric',
        seats: 5,
        doors: 4,
        dailyRate: 35000,
        securityDeposit: 100000,
        mileageLimitPerDay: 250,
        location: {
          address: '450 Mission St, SOMA',
          city: 'Lagos',
          state: 'Lagos',
        },
        images: [
          'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['Autopilot', 'Glass Panoramic Roof', 'Heated Seats', 'Wireless Phone Charging', 'Premium Sound System', 'GPS Navigation', 'Keyless Entry'],
        specs: {
          horsepower: 456,
          acceleration: '3.5s (0-60 mph)',
          fuelEconomyOrRange: '303 mi Range',
          topSpeed: '155 mph',
        },
        description: 'Blisteringly fast dual-motor AWD Model Y with full self-driving computer, pristine condition, and free supercharging included for local trips!',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'CA-9EV-8821',
        insurancePolicyNumber: 'POL-SF-991024',
        isFeatured: true,
        rating: 4.96,
        reviewCount: 28,
        tripCount: 42,
      },
      {
        host: host2._id,
        title: '2023 Porsche 911 Carrera 4S Cabriolet',
        make: 'Porsche',
        model: '911 Carrera 4S',
        year: 2023,
        category: 'Sports',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seats: 4,
        doors: 2,
        dailyRate: 90000,
        securityDeposit: 250000,
        mileageLimitPerDay: 150,
        location: {
          address: '9641 Sunset Blvd, Beverly Hills',
          city: 'Abuja',
          state: 'FCT',
        },
        images: [
          'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['Sport Chrono Package', 'Convertible Top', 'Bose Surround Audio', 'Apple CarPlay', 'Sport Exhaust System', 'Heated & Ventilated Seats'],
        specs: {
          horsepower: 443,
          acceleration: '3.4s (0-60 mph)',
          fuelEconomyOrRange: '23 MPG',
          topSpeed: '188 mph',
        },
        description: 'The ultimate California coastline cruiser. Twin-turbo flat-six engine with unforgettable acoustic roar and drop-top freedom.',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'CA-911-LUX',
        insurancePolicyNumber: 'POL-LA-339180',
        isFeatured: true,
        rating: 5.0,
        reviewCount: 19,
        tripCount: 25,
      },
      {
        host: host2._id,
        title: '2024 Mercedes-Benz G 63 AMG Night Edition',
        make: 'Mercedes-Benz',
        model: 'G 63 AMG',
        year: 2024,
        category: 'Luxury',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seats: 5,
        doors: 4,
        dailyRate: 120000,
        securityDeposit: 300000,
        mileageLimitPerDay: 150,
        location: {
          address: 'Ocean Drive & 8th St, South Beach',
          city: 'Port Harcourt',
          state: 'Rivers',
        },
        images: [
          'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['Handcrafted Biturbo V8', 'Burmester High-End 3D Sound', 'Ambient 64-Color Lighting', 'Massage Front Seats', '360 Surround Camera'],
        specs: {
          horsepower: 577,
          acceleration: '4.5s (0-60 mph)',
          fuelEconomyOrRange: '15 MPG',
          topSpeed: '149 mph',
        },
        description: 'Imposing luxury presence combined with handcrafted twin-turbocharged V8 performance. The quintessential Miami flagship.',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'FL-AMG-7700',
        insurancePolicyNumber: 'POL-FL-550182',
        isFeatured: true,
        rating: 4.95,
        reviewCount: 14,
        tripCount: 18,
      },
      {
        host: host1._id,
        title: '2023 BMW M4 Competition xDrive Coupe',
        make: 'BMW',
        model: 'M4 Competition',
        year: 2023,
        category: 'Sports',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seats: 4,
        doors: 2,
        dailyRate: 70000,
        securityDeposit: 200000,
        mileageLimitPerDay: 200,
        location: {
          address: 'Columbus Circle, Midtown',
          city: 'Ibadan',
          state: 'Oyo',
        },
        images: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['M Carbon Bucket Seats', 'Harmon Kardon Sound', 'Head-Up Display', 'M Track Mode', 'Carbon Fiber Roof', 'Adaptive M Suspension'],
        specs: {
          horsepower: 503,
          acceleration: '3.4s (0-60 mph)',
          fuelEconomyOrRange: '22 MPG',
          topSpeed: '180 mph',
        },
        description: '503 Horsepower of pure Munich engineering. Isle of Man Green exterior with Kyalami Orange leather interior.',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'NY-M4-9022',
        insurancePolicyNumber: 'POL-NY-772109',
        isFeatured: true,
        rating: 4.92,
        reviewCount: 22,
        tripCount: 30,
      },
      {
        host: host1._id,
        title: '2023 Audi RS6 Avant Quattro Dynamic',
        make: 'Audi',
        model: 'RS6 Avant',
        year: 2023,
        category: 'Luxury',
        transmission: 'Automatic',
        fuelType: 'Hybrid',
        seats: 5,
        doors: 5,
        dailyRate: 85000,
        securityDeposit: 200000,
        mileageLimitPerDay: 200,
        location: {
          address: 'Pike Place Corridor, Downtown',
          city: 'Benin City',
          state: 'Edo',
        },
        images: [
          'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['Twin-Turbo V8 Mild Hybrid', 'Quattro All-Wheel Drive', 'Bang & Olufsen 3D Sound', 'All-Wheel Steering', 'Valcona Leather'],
        specs: {
          horsepower: 591,
          acceleration: '3.5s (0-60 mph)',
          fuelEconomyOrRange: '20 MPG',
          topSpeed: '190 mph',
        },
        description: 'The ultimate superwagon. Unrivaled practicality meets ferocious supercar-level acceleration with legendary Quattro grip in all weather.',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'WA-RS6-4411',
        insurancePolicyNumber: 'POL-WA-129044',
        isFeatured: false,
        rating: 4.9,
        reviewCount: 11,
        tripCount: 15,
      },
      {
        host: host2._id,
        title: '2024 Porsche Taycan Turbo S EV',
        make: 'Porsche',
        model: 'Taycan Turbo S',
        year: 2024,
        category: 'Electric',
        transmission: 'Automatic',
        fuelType: 'Electric',
        seats: 4,
        doors: 4,
        dailyRate: 100000,
        securityDeposit: 250000,
        mileageLimitPerDay: 200,
        location: {
          address: 'Santa Monica Blvd, West Hollywood',
          city: 'Lagos',
          state: 'Lagos',
        },
        images: [
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['800V Fast Charging', 'Porsche Electric Sport Sound', 'Ceramic Composite Brakes', 'Passenger Display Screen', 'Air Suspension'],
        specs: {
          horsepower: 750,
          acceleration: '2.6s (0-60 mph)',
          fuelEconomyOrRange: '278 mi Range',
          topSpeed: '161 mph',
        },
        description: 'Zero emissions with mind-bending electric launch control. The apex of electric sports sedan performance.',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'CA-TAY-0099',
        insurancePolicyNumber: 'POL-LA-882711',
        isFeatured: true,
        rating: 5.0,
        reviewCount: 15,
        tripCount: 20,
      },
      {
        host: host1._id,
        title: '2023 Range Rover Sport Autobiography',
        make: 'Land Rover',
        model: 'Range Rover Sport',
        year: 2023,
        category: 'SUV',
        transmission: 'Automatic',
        fuelType: 'Hybrid',
        seats: 5,
        doors: 4,
        dailyRate: 75000,
        securityDeposit: 180000,
        mileageLimitPerDay: 200,
        location: {
          address: 'Congress Ave, Downtown',
          city: 'Abuja',
          state: 'FCT',
        },
        images: [
          'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['Dynamic Air Suspension', 'Meridian Signature Sound', 'Terrain Response 2', 'Cabin Air Purification Pro', 'Soft Door Close'],
        specs: {
          horsepower: 523,
          acceleration: '4.3s (0-60 mph)',
          fuelEconomyOrRange: '21 MPG',
          topSpeed: '155 mph',
        },
        description: 'Peerless British refinement, commanding seating position, and whisper-quiet cabin insulation for comfortable Hill Country road trips.',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'TX-RRS-6019',
        insurancePolicyNumber: 'POL-TX-449102',
        isFeatured: false,
        rating: 4.88,
        reviewCount: 9,
        tripCount: 14,
      },
      {
        host: host2._id,
        title: '2023 Hyundai Ioniq 5 Limited AWD',
        make: 'Hyundai',
        model: 'Ioniq 5',
        year: 2023,
        category: 'Compact',
        transmission: 'Automatic',
        fuelType: 'Electric',
        seats: 5,
        doors: 4,
        dailyRate: 30000,
        securityDeposit: 75000,
        mileageLimitPerDay: 300,
        location: {
          address: 'Union Square, Downtown',
          city: 'Enugu',
          state: 'Enugu',
        },
        images: [
          'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['Ultra-Fast 350kW Charging', 'Smart Cruise Control', 'Vision Glass Roof', 'Relaxation Comfort Seats', 'V2L Power Outlet'],
        specs: {
          horsepower: 320,
          acceleration: '5.1s (0-60 mph)',
          fuelEconomyOrRange: '266 mi Range',
          topSpeed: '115 mph',
        },
        description: 'Retro-futuristic styling meets spacious interior lounge comfort. Super smooth EV drive with ultra-fast 18-minute highway charging.',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'CA-ION-5501',
        insurancePolicyNumber: 'POL-SF-220199',
        isFeatured: false,
        rating: 4.85,
        reviewCount: 16,
        tripCount: 31,
      },
      {
        host: host1._id,
        title: '2024 Ford Mustang Dark Horse 5.0L V8',
        make: 'Ford',
        model: 'Mustang Dark Horse',
        year: 2024,
        category: 'Sports',
        transmission: 'Manual',
        fuelType: 'Petrol',
        seats: 4,
        doors: 2,
        dailyRate: 55000,
        securityDeposit: 150000,
        mileageLimitPerDay: 200,
        location: {
          address: 'Michigan Ave, The Loop',
          city: 'Kano',
          state: 'Kano',
        },
        images: [
          'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['TREMEC 6-Speed Manual', 'Active Valve Performance Exhaust', 'MagneRide Damping', 'Brembo 6-Piston Brakes', 'Drift Brake'],
        specs: {
          horsepower: 500,
          acceleration: '3.7s (0-60 mph)',
          fuelEconomyOrRange: '18 MPG',
          topSpeed: '166 mph',
        },
        description: 'Naturally aspirated 500-HP Coyote V8 with pure 6-speed manual engagement. Crisp heel-toe rev matching and head-turning exhaust note.',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'IL-DH-5000',
        insurancePolicyNumber: 'POL-IL-884102',
        isFeatured: false,
        rating: 4.95,
        reviewCount: 12,
        tripCount: 17,
      },
      {
        host: host1._id,
        title: '2024 Chevrolet Corvette Stingray 3LT Coupe',
        make: 'Chevrolet',
        model: 'Corvette Stingray',
        year: 2024,
        category: 'Sports',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seats: 2,
        doors: 2,
        dailyRate: 80000,
        securityDeposit: 200000,
        mileageLimitPerDay: 150,
        location: {
          address: 'Las Vegas Blvd, The Strip',
          city: 'Uyo',
          state: 'Akwa Ibom',
        },
        images: [
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['Mid-Engine 6.2L V8', 'Z51 Performance Package', 'Performance Data Recorder', 'Removable Roof Panel', 'Bose 14-Speaker Audio'],
        specs: {
          horsepower: 495,
          acceleration: '2.9s (0-60 mph)',
          fuelEconomyOrRange: '24 MPG',
          topSpeed: '194 mph',
        },
        description: 'Exotic mid-engine supercar layout with American V8 punch. Torch Red exterior with GT2 Napa leather competition seats.',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'NV-VET-8822',
        insurancePolicyNumber: 'POL-NV-331092',
        isFeatured: true,
        rating: 4.97,
        reviewCount: 24,
        tripCount: 38,
      },
      {
        host: host2._id,
        title: '2023 Mini Cooper S Convertible Iconic',
        make: 'Mini',
        model: 'Cooper S Convertible',
        year: 2023,
        category: 'Compact',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seats: 4,
        doors: 2,
        dailyRate: 32000,
        securityDeposit: 100000,
        mileageLimitPerDay: 250,
        location: {
          address: 'Gaslamp Quarter, Harbor Dr',
          city: 'Port Harcourt',
          state: 'Rivers',
        },
        images: [
          'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['3-in-1 Electric Soft Top', 'Go-Kart Drive Modes', 'Harman/Kardon HiFi Sound', 'Chesterfield Malt Brown Leather', 'Union Jack LED Lights'],
        specs: {
          horsepower: 189,
          acceleration: '6.7s (0-60 mph)',
          fuelEconomyOrRange: '33 MPG',
          topSpeed: '143 mph',
        },
        description: 'Zippy, cheerful convertible ideal for cruising Pacific Beach, Balboa Park, and Coronado Island in the sunny California breeze.',
        verificationStatus: 'approved',
        vehicleRegistrationNumber: 'CA-MIN-9941',
        insurancePolicyNumber: 'POL-SD-119283',
        isFeatured: false,
        rating: 4.9,
        reviewCount: 14,
        tripCount: 22,
      },
      // Vehicle in "Pending Verification" to demonstrate the Intermediary Agency verification queue
      {
        host: host1._id,
        title: '2024 BMW i4 eDrive40 Gran Coupe',
        make: 'BMW',
        model: 'i4 eDrive40',
        year: 2024,
        category: 'Electric',
        transmission: 'Automatic',
        fuelType: 'Electric',
        seats: 5,
        doors: 4,
        dailyRate: 45000,
        securityDeposit: 120000,
        mileageLimitPerDay: 250,
        location: {
          address: 'Market St, SOMA',
          city: 'Lagos',
          state: 'Lagos',
        },
        images: [
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        ],
        features: ['BMW Curved Display', 'Iconic Sounds Electric', 'Comfort Access', 'Wireless Charging', 'Park Assist'],
        specs: {
          horsepower: 335,
          acceleration: '5.5s (0-60 mph)',
          fuelEconomyOrRange: '301 mi Range',
          topSpeed: '118 mph',
        },
        description: 'Brand new luxury electric Gran Coupe just submitted by host Marcus. Pending Agency document & inspection review.',
        verificationStatus: 'pending',
        vehicleRegistrationNumber: 'CA-NEW-4001',
        insurancePolicyNumber: 'POL-SF-881200',
        isFeatured: false,
        rating: 5.0,
        reviewCount: 0,
        tripCount: 0,
      },
    ];

    const insertedCars = await Car.insertMany(carsData);
    console.log(`✅ Seeded ${insertedCars.length} Vehicles.`);

    // 3. Create Sample Bookings & Transactions
    const teslaCar = insertedCars[0];
    const porscheCar = insertedCars[1];

    // Completed Trip with Review
    const pastStart = new Date(Date.now() - 3600000 * 24 * 7);
    const pastEnd = new Date(Date.now() - 3600000 * 24 * 4);
    const days1 = 3;
    const subtotal1 = teslaCar.dailyRate * days1;
    const fee1 = Math.round(subtotal1 * 0.15);
    const ins1 = 5000 * days1;
    const dep1 = teslaCar.securityDeposit;
    const total1 = subtotal1 + fee1 + ins1 + dep1;

    const completedBooking = await Booking.create({
      car: teslaCar._id,
      renter: renter1._id,
      host: teslaCar.host,
      startDate: pastStart,
      endDate: pastEnd,
      totalDays: days1,
      dailyRate: teslaCar.dailyRate,
      subtotal: subtotal1,
      serviceFee: fee1,
      insuranceFee: ins1,
      securityDeposit: dep1,
      totalAmount: total1,
      status: 'completed',
      paymentStatus: 'released_to_host',
      handoverDetails: {
        pickupOdometer: 14200,
        returnOdometer: 14510,
        pickupFuelLevel: '95%',
        returnFuelLevel: '92%',
        pickupNotes: 'Car handed over spotless.',
        returnNotes: 'Returned in pristine condition, supercharged to 92%.',
        pickupConfirmedAt: pastStart,
        returnConfirmedAt: pastEnd,
      },
      hasReview: true,
    });

    await Review.create({
      booking: completedBooking._id,
      car: teslaCar._id,
      author: renter1._id,
      rating: 5,
      cleanlinessRating: 5,
      communicationRating: 5,
      comment: 'Flawless experience! Marcus is an exceptional host. The Model Y was sparkling clean, drove like a dream on Highway 1, and the handover was effortless.',
    });

    await Transaction.create({
      booking: completedBooking._id,
      user: renter1._id,
      type: 'booking_payment',
      amount: total1,
      status: 'completed',
      description: `Payment for ${days1}-day trip in Tesla Model Y`,
    });

    await Transaction.create({
      booking: completedBooking._id,
      user: host1._id,
      type: 'host_payout',
      amount: subtotal1,
      status: 'completed',
      description: `Earnings payout to host Marcus Vance ($${subtotal1})`,
    });

    // Confirmed / Upcoming Booking
    const futureStart = new Date(Date.now() + 3600000 * 24 * 2);
    const futureEnd = new Date(Date.now() + 3600000 * 24 * 5);
    const days2 = 3;
    const subtotal2 = porscheCar.dailyRate * days2;
    const fee2 = Math.round(subtotal2 * 0.15);
    const ins2 = 5000 * days2;
    const dep2 = porscheCar.securityDeposit;
    const total2 = subtotal2 + fee2 + ins2 + dep2;

    await Booking.create({
      car: porscheCar._id,
      renter: renter1._id,
      host: porscheCar.host,
      startDate: futureStart,
      endDate: futureEnd,
      totalDays: days2,
      dailyRate: porscheCar.dailyRate,
      subtotal: subtotal2,
      serviceFee: fee2,
      insuranceFee: ins2,
      securityDeposit: dep2,
      totalAmount: total2,
      status: 'confirmed',
      paymentStatus: 'escrow_held',
    });

    console.log('✅ Seeded Sample Bookings, Reviews, and Financial Transactions.');
    console.log('🎉 Database seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeder Error:', err);
  }
};

module.exports = seedDatabase;

// Run standalone if invoked directly
if (require.main === module) {
  const connectDB = require('../config/db');
  connectDB().then(() => {
    seedDatabase().then(() => {
      process.exit(0);
    });
  });
}

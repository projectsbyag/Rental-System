// ==========================================================================
// RentPeer - Automated API & Workflow Verification Test Suite
// ==========================================================================

const http = require('http');

const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1';

const makeRequest = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: HOST,
      port: PORT,
      path,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

async function runTests() {
  console.log('🧪 Starting Automated API Test Suite for RentPeer Platform...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('1️⃣ Checking Health Endpoint');
    const health = await makeRequest('/api/health');
    assert(health.status === 200 && health.body.status === 'online', 'Server is online and responding');

    // 2. Auth: Admin Login
    console.log('\n2️⃣ Testing Authentication (Admin)');
    const adminLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@rentpeer.com',
      password: 'admin123',
    });
    assert(adminLogin.status === 200 && adminLogin.body.token, 'Admin authenticated successfully');
    const adminToken = adminLogin.body?.token;

    // 3. Auth: Host Login
    console.log('\n3️⃣ Testing Authentication (Host)');
    const hostLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'host@rentpeer.com',
      password: 'host123',
    });
    assert(hostLogin.status === 200 && hostLogin.body.user.role === 'host', 'Host authenticated successfully');
    const hostToken = hostLogin.body?.token;

    // 4. Auth: Renter Login
    console.log('\n4️⃣ Testing Authentication (Renter)');
    const renterLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'renter@rentpeer.com',
      password: 'renter123',
    });
    assert(renterLogin.status === 200 && renterLogin.body.user.role === 'renter', 'Renter authenticated successfully');
    const renterToken = renterLogin.body?.token;

    const roleEscalation = await makeRequest('/api/auth/switch-role', 'POST', { role: 'admin' }, renterToken);
    assert(roleEscalation.status === 403, 'Renter cannot escalate their account to admin');

    // 5. Cars: Get Public Catalog & Filters
    console.log('\n5️⃣ Testing Vehicle Search & Filter Endpoints');
    const allCars = await makeRequest('/api/cars');
    assert(allCars.status === 200 && allCars.body.count > 0, `Retrieved ${allCars.body.count} approved vehicles`);

    const electricCars = await makeRequest('/api/cars?category=Electric');
    assert(electricCars.status === 200 && electricCars.body.data.length > 0, `Electric category filter returned ${electricCars.body.data.length} cars`);

    const sampleCar = allCars.body.data[0];
    const singleCar = await makeRequest(`/api/cars/${sampleCar._id}`);
    assert(singleCar.status === 200 && singleCar.body.data.make === sampleCar.make, `Retrieved detailed specs for ${singleCar.body.data.title}`);

    const renterCarCreate = await makeRequest('/api/cars', 'POST', {
      title: 'Unauthorized Listing',
      make: 'Test',
      model: 'Car',
      year: 2024,
      category: 'Compact',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seats: 5,
      dailyRate: 10000,
      location: { city: 'Lagos' },
    }, renterToken);
    assert(renterCarCreate.status === 403, 'Renter cannot create host vehicle listings');

    const pendingStart = await makeRequest('/api/bookings/507f1f77bcf86cd799439011/start-trip', 'PATCH', {
      pickupOdometer: 100,
    }, renterToken);
    assert(pendingStart.status === 404, 'Unknown booking cannot be started');

    // 6. Booking Creation & Pricing/Escrow calculation
    console.log('\n6️⃣ Testing Renter Booking Request Workflow');
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 10);
    const end = new Date(today);
    end.setDate(today.getDate() + 13);

    const bookingRes = await makeRequest('/api/bookings', 'POST', {
      carId: sampleCar._id,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }, renterToken);

    assert(bookingRes.status === 201 && bookingRes.body.data.status === 'pending', 'Created booking request in pending state with escrow held');
    const createdBooking = bookingRes.body.data;
    assert(createdBooking.serviceFee > 0, `Calculated 15% Intermediary Agency Commission ($${createdBooking.serviceFee})`);

    const earlyStart = await makeRequest(`/api/bookings/${createdBooking._id}/start-trip`, 'PATCH', {
      pickupOdometer: 16000,
      pickupFuelLevel: '100%',
    }, renterToken);
    assert(earlyStart.status === 400, 'Pending booking cannot start before host acceptance');

    // 7. Host Approves Booking
    console.log('\n7️⃣ Testing Host Booking Acceptance');
    // Find the car's actual host email or use admin/host token
    const carDetails = await makeRequest(`/api/cars/${sampleCar._id}`);
    const hostEmail = carDetails.body.data?.host?.email || 'host@rentpeer.com';
    const specificHostLogin = await makeRequest('/api/auth/login', 'POST', {
      email: hostEmail,
      password: 'host123',
    });
    const activeHostToken = specificHostLogin.body?.token || hostToken;

    const acceptRes = await makeRequest(`/api/bookings/${createdBooking._id}/accept`, 'PATCH', {}, activeHostToken);
    assert(acceptRes.status === 200 && acceptRes.body.data.status === 'confirmed', 'Host accepted booking -> status is confirmed');

    // 8. Trip Start Handover
    console.log('\n8️⃣ Testing Trip Start & Handover');
    const startRes = await makeRequest(`/api/bookings/${createdBooking._id}/start-trip`, 'PATCH', {
      pickupOdometer: 16000,
      pickupFuelLevel: '100%',
      pickupNotes: 'Odometer and tires confirmed clean by renter.',
    }, renterToken);
    assert(startRes.status === 200 && startRes.body.data.status === 'active', 'Trip started -> status is active');

    // 9. Trip Completion & Host Payout Release
    console.log('\n9️⃣ Testing Trip Completion & Escrow Payout');
    const completeRes = await makeRequest(`/api/bookings/${createdBooking._id}/complete-trip`, 'PATCH', {
      returnOdometer: 16250,
      returnFuelLevel: '95%',
      returnNotes: 'Vehicle returned in flawless condition.',
    }, hostToken);
    assert(completeRes.status === 200 && completeRes.body.data.status === 'completed', 'Trip completed -> earnings released to host');

    // 10. Verified Review Submission
    console.log('\n🔟 Testing Verified Trip Review');
    const reviewRes = await makeRequest('/api/reviews', 'POST', {
      bookingId: createdBooking._id,
      rating: 5,
      cleanlinessRating: 5,
      communicationRating: 5,
      comment: 'Superb car and responsive host. Handover was seamless!',
    }, renterToken);
    assert(reviewRes.status === 201 && reviewRes.body.data.rating === 5, 'Verified review submitted successfully');

    // 11. Intermediary Agency Admin Operations
    console.log('\n1️⃣1️⃣ Testing Intermediary Agency (Admin) Controls');
    const metricsRes = await makeRequest('/api/admin/metrics', 'GET', null, adminToken);
    assert(metricsRes.status === 200 && metricsRes.body.data.totalGMV > 0, `Agency dashboard aggregated GMV ($${metricsRes.body.data.totalGMV}) and commission ($${metricsRes.body.data.totalAgencyCommission})`);

    const kycRes = await makeRequest('/api/admin/kyc-queue', 'GET', null, adminToken);
    assert(kycRes.status === 200 && Array.isArray(kycRes.body.data), `Retrieved ${kycRes.body.data.length} users in KYC queue`);

    const carsQueueRes = await makeRequest('/api/admin/cars-queue', 'GET', null, adminToken);
    assert(carsQueueRes.status === 200 && Array.isArray(carsQueueRes.body.data), `Retrieved ${carsQueueRes.body.data.length} vehicles in moderation queue`);

    console.log(`\n========================================`);
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Test execution error:', err.message);
    process.exit(1);
  }
}

// Run test if invoked
if (require.main === module) {
  runTests();
}

module.exports = runTests;

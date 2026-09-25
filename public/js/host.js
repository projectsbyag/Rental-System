// ==========================================================================
// RentPeer - Host Portal & Fleet Manager Controller
// ==========================================================================

const HostController = {
  currentWizardStep: 1,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Open Add Car Modal
    const openAddCarBtn = document.getElementById('open-add-car-modal-btn');
    if (openAddCarBtn) {
      openAddCarBtn.addEventListener('click', () => this.openAddCarWizard());
    }

    // Wizard Next & Prev buttons
    const nextBtn = document.getElementById('wizard-next-btn');
    const prevBtn = document.getElementById('wizard-prev-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep());
    }

    // Add Car Form Submit
    const addCarForm = document.getElementById('add-car-form');
    if (addCarForm) {
      addCarForm.addEventListener('submit', (e) => this.handleCreateCar(e));
    }
  },

  async loadHostDashboard() {
    await Promise.all([
      this.loadHostFleet(),
      this.loadHostReservations(),
    ]);
  },

  async loadHostFleet() {
    const tableBody = document.getElementById('host-fleet-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem;">
          <div class="badge badge-cyan">⚡ Loading your fleet...</div>
        </td>
      </tr>
    `;

    try {
      const res = await API.cars.getMyFleet();
      if (res.success) {
        State.hostFleet = res.data;
        this.renderHostFleet(res.data);
        this.updateHostMetrics();
      }
    } catch (err) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--accent-red); padding: 2rem;">
            ⚠️ Error loading fleet: ${err.message}
          </td>
        </tr>
      `;
    }
  },

  async loadHostReservations() {
    const container = document.getElementById('host-reservations-list');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div class="badge badge-cyan">⚡ Loading incoming reservations...</div>
      </div>
    `;

    try {
      const res = await API.bookings.getHostReservations();
      if (res.success) {
        State.hostReservations = res.data;
        this.renderHostReservations(res.data);
        this.updateHostMetrics();
      }
    } catch (err) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--accent-red); padding: 2rem;">
          ⚠️ Error loading reservations: ${err.message}
        </div>
      `;
    }
  },

  renderHostFleet(cars) {
    const tableBody = document.getElementById('host-fleet-table-body');
    if (!tableBody) return;

    if (cars.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🚘✨</div>
            <h4>No vehicles listed yet</h4>
            <p style="font-size: 0.85rem; margin-top: 0.25rem;">Start earning by listing your unused or luxury vehicle on RentPeer.</p>
            <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="HostController.openAddCarWizard()">
              + List Your First Car
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = cars.map((car) => {
      const img = car.images && car.images[0] ? car.images[0] : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80';
      
      let verificationBadge = '<span class="badge badge-gold">Pending Agency Verification</span>';
      if (car.verificationStatus === 'approved') verificationBadge = '<span class="badge badge-green">Verified & Approved</span>';
      if (car.verificationStatus === 'rejected') verificationBadge = '<span class="badge badge-red">Rejected / Action Needed</span>';

      return `
        <tr id="fleet-row-${car._id}">
          <td>
            <div class="table-car-preview">
              <img src="${img}" class="table-car-img" />
              <div>
                <strong>${car.year} ${car.make} ${car.model}</strong>
                <div style="font-size: 0.78rem; color: var(--text-dim);">${car.category} • ${car.transmission}</div>
              </div>
            </div>
          </td>
          <td>
            ${car.location?.city || 'San Francisco'}, ${car.location?.state || 'CA'}
          </td>
          <td>
            <strong style="color: var(--primary);">$${car.dailyRate}</strong> / day
          </td>
          <td>
            ${verificationBadge}
          </td>
          <td>
            <span class="badge ${car.isActive ? 'badge-cyan' : 'badge-gold'}">
              ${car.isActive ? 'Active' : 'Paused'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-outline btn-sm" onclick="HostController.toggleCarStatus('${car._id}')">
                ${car.isActive ? 'Pause' : 'Activate'}
              </button>
              <button class="btn btn-ghost btn-sm" style="color: var(--accent-red);" onclick="HostController.deleteCar('${car._id}')">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderHostReservations(reservations) {
    const container = document.getElementById('host-reservations-list');
    if (!container) return;

    if (reservations.length === 0) {
      container.innerHTML = `
        <div class="glass-panel" style="text-align: center; padding: 3rem;">
          <h4>No incoming booking requests</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">New renter booking requests will appear here for your approval.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = reservations.map((b) => {
      const car = b.car || {};
      const renter = b.renter || {};
      const start = new Date(b.startDate).toLocaleDateString();
      const end = new Date(b.endDate).toLocaleDateString();

      let statusBadge = '<span class="badge badge-gold">Pending Your Approval</span>';
      if (b.status === 'confirmed') statusBadge = '<span class="badge badge-cyan">Confirmed</span>';
      if (b.status === 'active') statusBadge = '<span class="badge badge-green">In Progress</span>';
      if (b.status === 'completed') statusBadge = '<span class="badge badge-indigo">Completed • Paid</span>';
      if (b.status === 'rejected' || b.status === 'cancelled') statusBadge = '<span class="badge badge-red">Cancelled / Declined</span>';

      return `
        <div class="trip-card fade-in" style="grid-template-columns: 80px 1fr auto; margin-bottom: 1rem;">
          <img src="${renter.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);" />
          
          <div class="trip-info">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${statusBadge}
              <span style="font-size: 0.75rem; color: var(--text-dim);">Renter KYC: <strong style="color: var(--accent-green);">${renter.kycStatus || 'verified'}</strong></span>
            </div>

            <h3 style="font-size: 1.15rem; color: #ffffff;">${renter.name} wants to rent ${car.year} ${car.make} ${car.model}</h3>

            <div style="font-size: 0.85rem; color: var(--text-muted);">
              📅 <strong>${start} → ${end}</strong> (${b.totalDays} Days) • Your Earnings: <strong style="color: var(--accent-green);">$${b.subtotal}</strong> (Held in Escrow: $${b.totalAmount})
            </div>
          </div>

          <div class="trip-actions">
            ${b.status === 'pending' ? `
              <button class="btn btn-success btn-sm" onclick="HostController.acceptBooking('${b._id}')">
                ✓ Accept Booking
              </button>
              <button class="btn btn-ghost btn-sm" style="color: var(--accent-red);" onclick="HostController.declineBooking('${b._id}')">
                ✕ Decline
              </button>
            ` : ''}

            ${b.status === 'active' ? `
              <button class="btn btn-primary btn-sm" onclick="BookingsController.openHandoverModal('${b._id}', 'complete')">
                Verify Return & Payout
              </button>
            ` : ''}

            <span style="font-size: 0.75rem; color: var(--text-dim); text-align: center;">ID: #${b._id.substring(b._id.length - 6)}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  updateHostMetrics() {
    const grossEarningsEl = document.getElementById('host-metric-earnings');
    const tripsEl = document.getElementById('host-metric-trips');
    const fleetEl = document.getElementById('host-metric-fleet');
    const ratingEl = document.getElementById('host-metric-rating');

    let totalEarnings = 0;
    let completedTrips = 0;

    State.hostReservations.forEach((b) => {
      if (b.status === 'completed') {
        totalEarnings += b.subtotal || 0;
        completedTrips++;
      }
    });

    if (grossEarningsEl) grossEarningsEl.textContent = `$${totalEarnings.toLocaleString()}`;
    if (tripsEl) tripsEl.textContent = `${completedTrips}`;
    if (fleetEl) fleetEl.textContent = `${State.hostFleet.length}`;
    if (ratingEl) ratingEl.textContent = `${State.currentUser?.rating ? State.currentUser.rating.toFixed(2) : '5.0'}`;
  },

  openAddCarWizard() {
    const modal = document.getElementById('add-car-modal');
    if (!modal) return;
    this.currentWizardStep = 1;
    this.updateWizardView();
    modal.classList.add('active');
  },

  nextStep() {
    if (this.currentWizardStep < 4) {
      this.currentWizardStep++;
      this.updateWizardView();
    }
  },

  prevStep() {
    if (this.currentWizardStep > 1) {
      this.currentWizardStep--;
      this.updateWizardView();
    }
  },

  updateWizardView() {
    for (let i = 1; i <= 4; i++) {
      const pane = document.getElementById(`wizard-pane-${i}`);
      const step = document.getElementById(`wizard-step-ind-${i}`);
      if (pane) pane.classList.toggle('active', i === this.currentWizardStep);
      if (step) {
        step.classList.toggle('active', i === this.currentWizardStep);
        step.classList.toggle('completed', i < this.currentWizardStep);
      }
    }

    const prevBtn = document.getElementById('wizard-prev-btn');
    const nextBtn = document.getElementById('wizard-next-btn');
    const submitBtn = document.getElementById('wizard-submit-btn');

    if (prevBtn) prevBtn.style.display = this.currentWizardStep === 1 ? 'none' : 'inline-flex';
    if (nextBtn) nextBtn.style.display = this.currentWizardStep === 4 ? 'none' : 'inline-flex';
    if (submitBtn) submitBtn.style.display = this.currentWizardStep === 4 ? 'inline-flex' : 'none';
  },

  async handleCreateCar(e) {
    e.preventDefault();
    const make = document.getElementById('new-car-make').value.trim();
    const model = document.getElementById('new-car-model').value.trim();
    const year = document.getElementById('new-car-year').value;
    const category = document.getElementById('new-car-category').value;
    const transmission = document.getElementById('new-car-trans').value;
    const fuelType = document.getElementById('new-car-fuel').value;
    const seats = document.getElementById('new-car-seats').value;

    const city = document.getElementById('new-car-city').value.trim();
    const address = document.getElementById('new-car-address').value.trim();
    const state = document.getElementById('new-car-state').value.trim();
    const dailyRate = document.getElementById('new-car-price').value;
    const securityDeposit = document.getElementById('new-car-deposit').value;

    const horsepower = document.getElementById('new-car-hp').value;
    const acceleration = document.getElementById('new-car-accel').value;
    const fuelEconomy = document.getElementById('new-car-range').value;

    const regNumber = document.getElementById('new-car-reg').value.trim();
    const insurancePolicy = document.getElementById('new-car-insurance').value.trim();
    const imageUrl = document.getElementById('new-car-img-url').value.trim();

    // Collect checked features
    const featureCheckboxes = document.querySelectorAll('.new-car-feature:checked');
    const features = Array.from(featureCheckboxes).map((cb) => cb.value);

    const carData = {
      title: `${year} ${make} ${model}`,
      make,
      model,
      year: Number(year),
      category,
      transmission,
      fuelType,
      seats: Number(seats),
      dailyRate: Number(dailyRate),
      securityDeposit: Number(securityDeposit) || 200,
      location: { city, address, state },
      specs: {
        horsepower: Number(horsepower) || 300,
        acceleration: acceleration || '4.5s (0-60 mph)',
        fuelEconomyOrRange: fuelEconomy || '300 mi',
      },
      features,
      vehicleRegistrationNumber: regNumber,
      insurancePolicyNumber: insurancePolicy,
      images: [imageUrl || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'],
    };

    try {
      const res = await API.cars.create(carData);
      if (res.success) {
        document.getElementById('add-car-modal').classList.remove('active');
        Toast.success('Vehicle successfully submitted to the Intermediary Agency verification queue!');
        this.loadHostFleet();
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to list car.');
    }
  },

  async acceptBooking(id) {
    try {
      const res = await API.bookings.accept(id);
      if (res.success) {
        Toast.success('Booking accepted! Vehicle reserved.');
        this.loadHostReservations();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async declineBooking(id) {
    const reason = prompt('Please state a reason for declining:');
    if (reason === null) return;

    try {
      const res = await API.bookings.decline(id, reason);
      if (res.success) {
        Toast.info('Booking request declined. Escrow funds returned to renter.');
        this.loadHostReservations();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async toggleCarStatus(id) {
    try {
      const res = await API.cars.toggleActive(id);
      if (res.success) {
        Toast.info(res.message);
        this.loadHostFleet();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async deleteCar(id) {
    if (!confirm('Are you sure you want to remove this vehicle from your fleet?')) return;
    try {
      const res = await API.cars.delete(id);
      if (res.success) {
        Toast.info('Car listing removed.');
        this.loadHostFleet();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },
};

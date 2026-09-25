// ==========================================================================
// RentPeer - Bookings & Trips Controller (Renter Hub)
// ==========================================================================

const BookingsController = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Review form submit
    const reviewForm = document.getElementById('review-submit-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => this.handleReviewSubmit(e));
    }

    // Dispute form submit
    const disputeForm = document.getElementById('dispute-submit-form');
    if (disputeForm) {
      disputeForm.addEventListener('submit', (e) => this.handleDisputeSubmit(e));
    }

    // Handover form submit
    const handoverForm = document.getElementById('handover-submit-form');
    if (handoverForm) {
      handoverForm.addEventListener('submit', (e) => this.handleHandoverSubmit(e));
    }
  },

  async loadRenterDashboard() {
    const container = document.getElementById('renter-trips-list');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div class="badge badge-cyan" style="font-size: 0.95rem; padding: 0.6rem 1.2rem;">
          ⚡ Loading your trips and reservations...
        </div>
      </div>
    `;

    try {
      const res = await API.bookings.getMyTrips();
      if (res.success) {
        State.myTrips = res.data;
        this.renderRenterTrips(res.data);
      }
    } catch (err) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--accent-red);">
          ⚠️ Error loading trips: ${err.message}
        </div>
      `;
    }
  },

  renderRenterTrips(trips) {
    const container = document.getElementById('renter-trips-list');
    if (!container) return;

    if (trips.length === 0) {
      container.innerHTML = `
        <div class="glass-panel" style="text-align: center; padding: 4rem 1.5rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️🚗</div>
          <h3>No booked trips yet</h3>
          <p style="margin-top: 0.5rem;">Browse thousands of verified peer vehicles and book your next drive.</p>
          <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="State.setView('explore')">
            Explore Vehicles
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = trips.map((t) => this.renderTripCard(t)).join('');
  },

  renderTripCard(trip) {
    const car = trip.car || {};
    const host = trip.host || {};
    const img = car.images && car.images[0] ? car.images[0] : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80';
    
    const start = new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let statusBadge = '<span class="badge badge-gold">Pending Host Confirmation</span>';
    if (trip.status === 'confirmed') statusBadge = '<span class="badge badge-cyan">Confirmed • Ready for Pickup</span>';
    if (trip.status === 'active') statusBadge = '<span class="badge badge-green">⚡ Active Journey in Progress</span>';
    if (trip.status === 'completed') statusBadge = '<span class="badge badge-indigo">Completed • Deposit Released</span>';
    if (trip.status === 'cancelled' || trip.status === 'rejected') statusBadge = '<span class="badge badge-red">Cancelled / Refunded</span>';

    return `
      <div class="trip-card fade-in" id="trip-${trip._id}">
        <img src="${img}" alt="${car.title}" class="trip-car-thumb" />
        
        <div class="trip-info">
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            ${statusBadge}
            <span style="font-size: 0.75rem; color: var(--text-dim);">Booking #${trip._id.substring(trip._id.length - 8).toUpperCase()}</span>
          </div>

          <h3 class="trip-title">${car.year || ''} ${car.make || ''} ${car.model || 'Vehicle'}</h3>

          <div class="trip-dates">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="18" y2="10"/></svg>
            <span>${start} → ${end} (${trip.totalDays} days)</span>
          </div>

          <div class="trip-host-row">
            <img src="${host.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}" class="trip-host-avatar" />
            <span>Host: <strong>${host.name || 'Verified Host'}</strong> (${host.phone || '+1 (555) 019-2831'})</span>
          </div>

          <div class="trip-financials">
            Total Escrow: <strong style="color: #ffffff;">$${trip.totalAmount}</strong> (Deposit: $${trip.securityDeposit}) • Status: <span style="color: var(--primary);">${trip.paymentStatus}</span>
          </div>
        </div>

        <div class="trip-actions">
          ${trip.status === 'confirmed' ? `
            <button class="btn btn-success btn-sm" onclick="BookingsController.openHandoverModal('${trip._id}', 'start')">
              🔑 Check-in & Start Trip
            </button>
          ` : ''}

          ${trip.status === 'active' ? `
            <button class="btn btn-primary btn-sm" onclick="BookingsController.openHandoverModal('${trip._id}', 'complete')">
              🏁 Complete Return & Release
            </button>
          ` : ''}

          ${trip.status === 'completed' && !trip.hasReview ? `
            <button class="btn btn-secondary btn-sm" onclick="BookingsController.openReviewModal('${trip._id}', '${car._id}', '${car.make} ${car.model}')">
              ⭐ Leave Verified Review
            </button>
          ` : ''}

          <button class="btn btn-outline btn-sm" onclick="BookingsController.openReceiptModal('${trip._id}')">
            📄 Escrow Receipt
          </button>

          ${['pending', 'confirmed'].includes(trip.status) ? `
            <button class="btn btn-ghost btn-sm" style="color: var(--accent-red);" onclick="BookingsController.cancelBooking('${trip._id}')">
              Cancel Booking
            </button>
          ` : ''}

          ${['confirmed', 'active', 'completed'].includes(trip.status) ? `
            <button class="btn btn-ghost btn-sm" style="color: var(--text-dim);" onclick="BookingsController.openDisputeModal('${trip._id}')">
              ⚠️ Report Issue
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  openHandoverModal(tripId, mode) {
    const modal = document.getElementById('handover-modal');
    const title = document.getElementById('handover-modal-title');
    const desc = document.getElementById('handover-modal-desc');
    const tripIdInput = document.getElementById('handover-trip-id');
    const modeInput = document.getElementById('handover-mode');
    const submitBtn = document.getElementById('handover-submit-btn');

    if (!modal) return;

    tripIdInput.value = tripId;
    modeInput.value = mode;

    if (mode === 'start') {
      title.textContent = 'Trip Pickup & Key Handover';
      desc.textContent = 'Confirm vehicle initial odometer reading and fuel level before driving away.';
      submitBtn.textContent = 'Confirm Handover & Start Journey';
    } else {
      title.textContent = 'Trip Return & Inspection';
      desc.textContent = 'Confirm vehicle return odometer and condition to release host payout and refund security deposit.';
      submitBtn.textContent = 'Complete Trip & Release Escrow';
    }

    modal.classList.add('active');
  },

  async handleHandoverSubmit(e) {
    e.preventDefault();
    const tripId = document.getElementById('handover-trip-id').value;
    const mode = document.getElementById('handover-mode').value;
    const odo = document.getElementById('handover-odometer').value;
    const fuel = document.getElementById('handover-fuel').value;
    const notes = document.getElementById('handover-notes').value;

    try {
      let res;
      if (mode === 'start') {
        res = await API.bookings.startTrip(tripId, { pickupOdometer: odo, pickupFuelLevel: fuel, pickupNotes: notes });
      } else {
        res = await API.bookings.completeTrip(tripId, { returnOdometer: odo, returnFuelLevel: fuel, returnNotes: notes });
      }

      if (res.success) {
        document.getElementById('handover-modal').classList.remove('active');
        Toast.success(res.message);
        this.loadRenterDashboard();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  openReviewModal(tripId, carId, carName) {
    const modal = document.getElementById('review-modal');
    const tripIdInput = document.getElementById('review-booking-id');
    const title = document.getElementById('review-modal-car-name');
    if (!modal) return;

    tripIdInput.value = tripId;
    if (title) title.textContent = `Review your trip with ${carName}`;
    modal.classList.add('active');
  },

  async handleReviewSubmit(e) {
    e.preventDefault();
    const bookingId = document.getElementById('review-booking-id').value;
    const rating = document.getElementById('review-rating').value;
    const cleanliness = document.getElementById('review-cleanliness').value;
    const communication = document.getElementById('review-communication').value;
    const comment = document.getElementById('review-comment').value;

    try {
      const res = await API.reviews.add({
        bookingId,
        rating,
        cleanlinessRating: cleanliness,
        communicationRating: communication,
        comment,
      });

      if (res.success) {
        document.getElementById('review-modal').classList.remove('active');
        Toast.success('Review submitted! Thank you for supporting peer trust.');
        this.loadRenterDashboard();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  openDisputeModal(tripId) {
    const modal = document.getElementById('dispute-modal');
    const tripIdInput = document.getElementById('dispute-trip-id');
    if (!modal) return;
    tripIdInput.value = tripId;
    modal.classList.add('active');
  },

  async handleDisputeSubmit(e) {
    e.preventDefault();
    const tripId = document.getElementById('dispute-trip-id').value;
    const reason = document.getElementById('dispute-reason').value;

    try {
      const res = await API.bookings.reportDispute(tripId, reason);
      if (res.success) {
        document.getElementById('dispute-modal').classList.remove('active');
        Toast.warning('Dispute ticket logged with the Intermediary Agency mediation department.');
        this.loadRenterDashboard();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async cancelBooking(tripId) {
    if (!confirm('Are you sure you want to cancel this booking? Escrow funds will be refunded.')) return;

    try {
      const res = await API.bookings.decline(tripId, 'Cancelled by renter');
      if (res.success) {
        Toast.info(res.message);
        this.loadRenterDashboard();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  openReceiptModal(tripId) {
    const trip = State.myTrips.find((t) => t._id === tripId);
    if (!trip) return;

    const modal = document.getElementById('receipt-modal');
    const container = document.getElementById('receipt-modal-content');
    if (!modal || !container) return;

    const car = trip.car || {};
    const host = trip.host || {};

    container.innerHTML = `
      <div style="background: #ffffff; border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 1.5rem; font-family: monospace;">
        <div style="text-align: center; border-bottom: 1px dashed var(--border-medium); padding-bottom: 1rem; margin-bottom: 1rem;">
          <h3 style="font-family: var(--font-heading); color: var(--primary);">RentPeer Escrow Statement</h3>
          <p style="font-size: 0.8rem; color: var(--text-dim);">Intermediary Agency Booking Reference</p>
          <div style="font-size: 0.9rem; font-weight: bold; margin-top: 0.5rem; color: var(--text-main);">#${trip._id}</div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
          <span style="color: var(--text-dim);">Vehicle:</span>
          <span>${car.year} ${car.make} ${car.model}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
          <span style="color: var(--text-dim);">Host:</span>
          <span>${host.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
          <span style="color: var(--text-dim);">Rental Period:</span>
          <span>${trip.totalDays} Days</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
          <span style="color: var(--text-dim);">Daily Rate:</span>
          <span>$${trip.dailyRate} / day</span>
        </div>

        <div style="border-top: 1px solid var(--border-subtle); margin: 0.8rem 0; padding-top: 0.8rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.85rem;">
            <span>Subtotal:</span>
            <span>$${trip.subtotal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.85rem;">
            <span>Agency Intermediary Fee (15%):</span>
            <span>$${trip.serviceFee}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.85rem;">
            <span>Basic Roadside Protection:</span>
            <span>$${trip.insuranceFee}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.85rem;">
            <span>Refundable Deposit:</span>
            <span>$${trip.securityDeposit}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.05rem; color: var(--primary); border-top: 1px dashed var(--border-medium); padding-top: 0.6rem; margin-top: 0.6rem;">
            <span>Total Escrow Amount:</span>
            <span>$${trip.totalAmount}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 1rem; font-size: 0.75rem; color: var(--text-dim);">
          Escrow Status: <strong>${trip.paymentStatus.toUpperCase()}</strong> • Verified by RentPeer Trust & Safety
        </div>
      </div>
    `;

    modal.classList.add('active');
  },
};

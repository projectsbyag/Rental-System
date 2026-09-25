// ==========================================================================
// RentPeer - Cars Catalog & Details Controller
// ==========================================================================

const CarsController = {
  init() {
    this.bindEvents();
    this.loadCars();
  },

  bindEvents() {
    // Hero Search Form
    const heroForm = document.getElementById('hero-search-form');
    if (heroForm) {
      heroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = document.getElementById('search-city').value;
        const startDate = document.getElementById('search-start-date').value;
        const endDate = document.getElementById('search-end-date').value;
        const category = document.getElementById('search-category').value;

        State.setFilters({ city, startDate, endDate, category });
        this.loadCars();

        // Scroll to fleet
        const fleetSec = document.getElementById('explore-section');
        if (fleetSec) {
          fleetSec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Category Filter Chips
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const cat = chip.dataset.category;
        State.setFilters({ category: cat });
        this.loadCars();
      });
    });

    // Transmission Filter
    const transSelect = document.getElementById('filter-transmission');
    if (transSelect) {
      transSelect.addEventListener('change', (e) => {
        State.setFilters({ transmission: e.target.value });
        this.loadCars();
      });
    }

    // Fuel Type Filter
    const fuelSelect = document.getElementById('filter-fuel');
    if (fuelSelect) {
      fuelSelect.addEventListener('change', (e) => {
        State.setFilters({ fuelType: e.target.value });
        this.loadCars();
      });
    }

    // Max Price Slider
    const priceSlider = document.getElementById('filter-price-slider');
    const priceDisplay = document.getElementById('price-slider-display');
    if (priceSlider && priceDisplay) {
      priceSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        priceDisplay.textContent = `$${val}`;
        State.setFilters({ maxPrice: val });
      });
      priceSlider.addEventListener('change', () => this.loadCars());
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('filter-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        State.setFilters({ sort: e.target.value });
        this.loadCars();
      });
    }

    // Keyword Search Input
    const searchInput = document.getElementById('search-keyword');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          State.setFilters({ search: e.target.value });
          this.loadCars();
        }, 300);
      });
    }
  },

  async loadCars() {
    const grid = document.getElementById('cars-grid');
    if (!grid) return;

    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <div class="badge badge-cyan" style="font-size: 0.95rem; padding: 0.6rem 1.2rem;">
          ⚡ Loading available verified fleet...
        </div>
      </div>
    `;

    try {
      const res = await API.cars.getAll(State.filters);
      if (res.success) {
        State.setCars(res.data);
        this.renderCars(res.data);
      }
    } catch (err) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--accent-red);">
          ⚠️ Failed to load vehicles. Please refresh or try again.
        </div>
      `;
    }
  },

  renderCars(cars) {
    const grid = document.getElementById('cars-grid');
    const countBadge = document.getElementById('cars-count-badge');
    if (!grid) return;

    if (countBadge) {
      countBadge.textContent = `${cars.length} Vehicle${cars.length === 1 ? '' : 's'} Available`;
    }

    if (cars.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🚗🔍</div>
          <h3>No vehicles match your search criteria</h3>
          <p style="margin-top: 0.5rem;">Try adjusting your location, price slider, or date filters.</p>
          <button class="btn btn-outline" style="margin-top: 1.5rem;" onclick="CarsController.resetFilters()">
            Reset All Filters
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = cars.map((car) => this.renderCarCard(car)).join('');

    // Attach click listeners to cards
    cars.forEach((car) => {
      const btn = document.getElementById(`view-car-btn-${car._id}`);
      if (btn) {
        btn.addEventListener('click', () => this.openCarDetailModal(car._id));
      }
    });
  },

  renderCarCard(car) {
    const mainImg = car.images && car.images[0] ? car.images[0] : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80';
    const isElectric = car.fuelType === 'Electric';
    const hp = car.specs?.horsepower || 300;
    const accel = car.specs?.acceleration || '4.5s';
    const rangeOrMpg = car.specs?.fuelEconomyOrRange || (isElectric ? '300 mi' : '25 MPG');

    return `
      <div class="car-card fade-in" id="car-card-${car._id}">
        <div class="car-card-img-wrapper">
          <img src="${mainImg}" alt="${car.title}" class="car-card-img" loading="lazy" />
          <div class="car-card-badges">
            ${car.isFeatured ? '<span class="badge badge-gold">★ Featured</span>' : ''}
            <span class="badge badge-cyan">${car.category}</span>
            ${isElectric ? '<span class="badge badge-indigo">⚡ 100% Electric</span>' : ''}
          </div>
          <div class="car-card-rating">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            <span>${car.rating ? car.rating.toFixed(1) : '5.0'}</span>
            <span style="color: var(--text-dim); font-size: 0.75rem;">(${car.reviewCount || 0})</span>
          </div>
        </div>

        <div class="car-card-content">
          <div class="car-card-header">
            <h3 class="car-card-title">${car.year} ${car.make} ${car.model}</h3>
          </div>
          <div class="car-card-location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${car.location?.city || 'San Francisco'}, ${car.location?.state || 'CA'}</span>
            <span class="badge badge-green" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; margin-left: auto;">Verified Host</span>
          </div>

          <div class="car-card-specs">
            <div class="spec-item">
              <span class="spec-label">Power</span>
              <span class="spec-val">${hp} HP</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">0-60 MPH</span>
              <span class="spec-val">${accel}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">${isElectric ? 'Range' : 'Economy'}</span>
              <span class="spec-val">${rangeOrMpg}</span>
            </div>
          </div>

          <div class="car-card-footer">
            <div class="car-card-price">
              <div class="price-daily">$${car.dailyRate} <span>/ day</span></div>
              <div class="price-total-estimate">No hidden counter fees</div>
            </div>
            <button class="btn btn-primary btn-sm" id="view-car-btn-${car._id}">
              Details & Book
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async openCarDetailModal(carId) {
    const modal = document.getElementById('car-detail-modal');
    const container = document.getElementById('car-detail-modal-content');
    if (!modal || !container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem;">
        <div class="badge badge-cyan" style="font-size: 1rem; padding: 0.8rem 1.6rem;">
          ⚡ Fetching Vehicle Specifications & Host Verified Credentials...
        </div>
      </div>
    `;
    modal.classList.add('active');

    try {
      const res = await API.cars.getById(carId);
      if (res.success && res.data) {
        const car = res.data;
        const reviews = res.reviews || [];
        State.selectedCar = car;
        this.renderCarDetailView(container, car, reviews);
      }
    } catch (err) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--accent-red);">
          ⚠️ Error loading car details: ${err.message}
        </div>
      `;
    }
  },

  renderCarDetailView(container, car, reviews) {
    const isElectric = car.fuelType === 'Electric';
    const mainImg = car.images && car.images[0] ? car.images[0] : '';
    const host = car.host || {};

    // Default dates for price calculator (Tomorrow -> +3 days)
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() + 1);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(today.getDate() + 4);

    const startStr = defaultStart.toISOString().split('T')[0];
    const endStr = defaultEnd.toISOString().split('T')[0];

    container.innerHTML = `
      <div class="car-detail-layout">
        <!-- Left Column: Specs, Gallery, Features, Reviews -->
        <div>
          <div class="car-gallery">
            <img src="${mainImg}" alt="${car.title}" id="detail-main-image" class="car-gallery-main" />
            <div style="position: absolute; bottom: 1rem; right: 1rem; display: flex; gap: 0.5rem;">
              ${(car.images || []).map((img, i) => `
                <img src="${img}" style="width: 50px; height: 38px; border-radius: 4px; object-fit: cover; cursor: pointer; border: 2px solid ${i === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.4)'};" onclick="document.getElementById('detail-main-image').src='${img}'" />
              `).join('')}
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <h2 style="font-size: 1.8rem; margin-bottom: 0.25rem;">${car.year} ${car.make} ${car.model}</h2>
              <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.9rem;">
                <span>📍 ${car.location?.address || ''}, ${car.location?.city}, ${car.location?.state}</span>
                <span>•</span>
                <span>⭐ ${car.rating || 5.0} (${car.reviewCount || 0} reviews)</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.4rem;">
              <span class="badge badge-cyan">${car.category}</span>
              <span class="badge badge-green">Agency Verified</span>
            </div>
          </div>

          <h4 style="margin-bottom: 0.75rem;">Technical Performance & Specs</h4>
          <div class="specs-grid-lg">
            <div class="spec-box">
              <div class="spec-label">Power</div>
              <div class="spec-val" style="font-size: 1.1rem; color: var(--primary);">${car.specs?.horsepower || 300} HP</div>
            </div>
            <div class="spec-box">
              <div class="spec-label">0-60 MPH</div>
              <div class="spec-val" style="font-size: 1.1rem; color: var(--primary);">${car.specs?.acceleration || '4.2s'}</div>
            </div>
            <div class="spec-box">
              <div class="spec-label">${isElectric ? 'Range' : 'Efficiency'}</div>
              <div class="spec-val" style="font-size: 1.1rem; color: var(--primary);">${car.specs?.fuelEconomyOrRange || '300 mi'}</div>
            </div>
            <div class="spec-box">
              <div class="spec-label">Transmission</div>
              <div class="spec-val" style="font-size: 1.1rem; color: var(--primary);">${car.transmission}</div>
            </div>
          </div>

          <h4 style="margin-bottom: 0.75rem;">Vehicle Features & Amenities</h4>
          <div class="features-list">
            ${(car.features || []).map((f) => `
              <div class="feature-tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>${f}</span>
              </div>
            `).join('')}
          </div>

          <h4 style="margin-bottom: 0.75rem;">Host Information</h4>
          <div class="host-profile-card">
            <img src="${host.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}" class="host-avatar-lg" />
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <h4 style="margin: 0; font-size: 1.1rem;">${host.name || 'Verified Host'}</h4>
                <span class="badge badge-gold" style="font-size: 0.65rem;">Superhost</span>
              </div>
              <p style="font-size: 0.85rem; margin: 0.2rem 0;">${host.bio || 'Experienced verified host dedicated to seamless peer car sharing.'}</p>
              <div style="display: flex; gap: 1rem; font-size: 0.78rem; color: var(--text-dim);">
                <span>⭐ ${host.rating || 5.0} Rating</span>
                <span>•</span>
                <span>🚗 ${host.totalTrips || 10}+ Trips Hosted</span>
                <span>•</span>
                <span>🛡️ ID Verified</span>
              </div>
            </div>
          </div>

          <h4 style="margin-bottom: 0.75rem;">Verified Renter Reviews (${reviews.length})</h4>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${reviews.length === 0 ? '<p style="font-size: 0.9rem; color: var(--text-muted);">No reviews yet for this vehicle. Be the first to rent and leave feedback!</p>' : ''}
            ${reviews.map((r) => `
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <img src="${r.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}" style="width: 28px; height: 28px; border-radius: 50%;" />
                    <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">${r.author?.name || 'Verified Renter'}</span>
                  </div>
                  <span style="color: var(--accent-gold); font-size: 0.85rem;">⭐ ${r.rating}.0</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${r.comment}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right Column: Interactive Price Calculation & Booking -->
        <div>
          <div class="price-breakdown-box">
            <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1.25rem;">
              <div style="font-size: 1.75rem; font-weight: 800; font-family: var(--font-heading); color: var(--text-main);">
                $${car.dailyRate} <span style="font-size: 0.9rem; font-weight: 400; color: var(--text-muted);">/ day</span>
              </div>
              <span class="badge badge-green">Escrow Protected</span>
            </div>

            <div class="form-group">
              <label class="form-label">Trip Start Date</label>
              <input type="date" id="book-start-date" class="form-input" value="${startStr}" min="${new Date().toISOString().split('T')[0]}" />
            </div>

            <div class="form-group">
              <label class="form-label">Trip End Date</label>
              <input type="date" id="book-end-date" class="form-input" value="${endStr}" min="${startStr}" />
            </div>

            <div style="border-top: 1px solid var(--border-subtle); margin: 1.25rem 0; padding-top: 1rem;">
              <div class="price-row">
                <span id="calc-days-label">$${car.dailyRate} × 3 days</span>
                <span id="calc-subtotal" style="font-weight: 600; color: var(--text-main);">$${car.dailyRate * 3}</span>
              </div>
              <div class="price-row">
                <span>Intermediary Service Fee (15%)</span>
                <span id="calc-fee" style="font-weight: 600; color: var(--text-main);">$${Math.round(car.dailyRate * 3 * 0.15)}</span>
              </div>
              <div class="price-row">
                <span>Basic Roadside & Trip Protection</span>
                <span id="calc-insurance" style="font-weight: 600; color: var(--text-main);">$45</span>
              </div>
              <div class="price-row">
                <span>Refundable Security Deposit</span>
                <span id="calc-deposit" style="font-weight: 600; color: var(--text-main);">$${car.securityDeposit || 200}</span>
              </div>
              <div class="price-row total">
                <span>Total Amount (Escrow)</span>
                <span id="calc-total" style="color: var(--primary);">$${car.dailyRate * 3 + Math.round(car.dailyRate * 3 * 0.15) + 45 + (car.securityDeposit || 200)}</span>
              </div>
            </div>

            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: var(--radius-sm); padding: 0.75rem; margin-bottom: 1.25rem; font-size: 0.78rem; color: #0369a1; line-height: 1.4;">
              🛡️ <strong>Agency Intermediary Escrow</strong>: Your payment is safely held in custody. The host is not paid until you complete your journey and confirm return.
            </div>

            <button class="btn btn-primary" id="submit-booking-request-btn" style="width: 100%; font-size: 1.05rem; padding: 0.9rem;">
              Request Booking & Escrow Hold
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind dynamic date changes to update live cost breakdown
    const startDateInput = document.getElementById('book-start-date');
    const endDateInput = document.getElementById('book-end-date');

    const updateCalculator = () => {
      const s = new Date(startDateInput.value);
      const e = new Date(endDateInput.value);
      if (s >= e) {
        document.getElementById('calc-total').textContent = 'Invalid Dates';
        return;
      }
      const diffTime = Math.abs(e - s);
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const sub = car.dailyRate * diffDays;
      const fee = Math.round(sub * 0.15);
      const ins = 15 * diffDays;
      const dep = car.securityDeposit || 200;
      const total = sub + fee + ins + dep;

      document.getElementById('calc-days-label').textContent = `$${car.dailyRate} × ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      document.getElementById('calc-subtotal').textContent = `$${sub}`;
      document.getElementById('calc-fee').textContent = `$${fee}`;
      document.getElementById('calc-insurance').textContent = `$${ins}`;
      document.getElementById('calc-deposit').textContent = `$${dep}`;
      document.getElementById('calc-total').textContent = `$${total}`;
    };

    startDateInput.addEventListener('change', () => {
      endDateInput.min = startDateInput.value;
      updateCalculator();
    });
    endDateInput.addEventListener('change', updateCalculator);

    // Booking Request Submit Button
    const bookBtn = document.getElementById('submit-booking-request-btn');
    bookBtn.addEventListener('click', async () => {
      if (!State.currentUser) {
        Toast.warning('Please log in or create an account to request a booking.');
        AuthController.showModal('login');
        return;
      }

      if (State.currentUser.role === 'admin') {
        Toast.warning('Admin accounts manage platform oversight. Please switch to a Renter account to book.');
        return;
      }

      try {
        bookBtn.disabled = true;
        bookBtn.innerHTML = 'Processing Escrow Request...';

        const res = await API.bookings.create({
          carId: car._id,
          startDate: startDateInput.value,
          endDate: endDateInput.value,
        });

        if (res.success) {
          Toast.success('Booking requested successfully! Payment is securely held in Intermediary Escrow.');
          document.getElementById('car-detail-modal').classList.remove('active');
          State.setView('renter-dash');
        }
      } catch (err) {
        Toast.error(err.message || 'Could not complete booking request.');
      } finally {
        bookBtn.disabled = false;
        bookBtn.innerHTML = 'Request Booking & Escrow Hold';
      }
    });
  },

  resetFilters() {
    State.setFilters({
      city: '',
      category: 'All',
      transmission: 'All',
      fuelType: 'All',
      maxPrice: 600,
      sort: 'recommended',
      search: '',
    });
    const slider = document.getElementById('filter-price-slider');
    const display = document.getElementById('price-slider-display');
    const keyword = document.getElementById('search-keyword');
    if (slider) slider.value = 600;
    if (display) display.textContent = '$600';
    if (keyword) keyword.value = '';
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach((c) => c.classList.toggle('active', c.dataset.category === 'All'));
    this.loadCars();
  },
};

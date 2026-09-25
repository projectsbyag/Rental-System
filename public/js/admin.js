// ==========================================================================
// RentPeer - Intermediary Agency (Admin) Operations Controller
// ==========================================================================

const AdminController = {
  activeTab: 'kyc',

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const tabs = document.querySelectorAll('.admin-nav-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.tab;
        this.switchAdminTab(this.activeTab);
      });
    });
  },

  async loadAdminDashboard() {
    await this.loadMetrics();
    this.switchAdminTab(this.activeTab);
  },

  async loadMetrics() {
    try {
      const res = await API.admin.getMetrics();
      if (res.success && res.data) {
        const d = res.data;
        document.getElementById('admin-metric-gmv').textContent = API.formatMoney(d.totalGMV);
        document.getElementById('admin-metric-commission').textContent = API.formatMoney(d.totalAgencyCommission);
        document.getElementById('admin-metric-escrow').textContent = API.formatMoney(d.escrowHeld);
        document.getElementById('admin-metric-cars').textContent = `${d.approvedCars || 0} (${d.pendingCars || 0} pending)`;
        document.getElementById('admin-metric-users').textContent = `${d.totalUsers || 0} (${d.pendingKYC || 0} pending KYC)`;

        // Update tab badges
        const kycBadge = document.getElementById('admin-kyc-badge');
        const carBadge = document.getElementById('admin-car-badge');
        if (kycBadge) kycBadge.textContent = d.pendingKYC || '0';
        if (carBadge) carBadge.textContent = d.pendingCars || '0';
      }
    } catch (err) {
      console.error('Error loading admin metrics:', err);
    }
  },

  switchAdminTab(tab) {
    const paneKYC = document.getElementById('admin-pane-kyc');
    const paneCars = document.getElementById('admin-pane-cars');
    const paneBookings = document.getElementById('admin-pane-bookings');
    const paneTransactions = document.getElementById('admin-pane-transactions');

    if (paneKYC) paneKYC.style.display = tab === 'kyc' ? 'block' : 'none';
    if (paneCars) paneCars.style.display = tab === 'cars' ? 'block' : 'none';
    if (paneBookings) paneBookings.style.display = tab === 'bookings' ? 'block' : 'none';
    if (paneTransactions) paneTransactions.style.display = tab === 'transactions' ? 'block' : 'none';

    if (tab === 'kyc') this.loadKYCQueue();
    if (tab === 'cars') this.loadCarsQueue();
    if (tab === 'bookings') this.loadBookingsQueue();
    if (tab === 'transactions') this.loadTransactionsQueue();
  },

  // 1. Driver KYC Verification Queue
  async loadKYCQueue() {
    const tableBody = document.getElementById('admin-kyc-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;"><div class="badge badge-gold">⚡ Loading KYC Queue...</div></td></tr>`;

    try {
      const res = await API.admin.getKYCQueue();
      if (res.success) {
        const users = res.data;
        if (users.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;">No pending KYC verification requests.</td></tr>`;
          return;
        }

        tableBody.innerHTML = users.map((u) => {
          const docImg = u.kycDocuments?.documentImage || '/uploads/id_placeholder.jpg';
          const isPending = u.kycStatus === 'pending';
          
          let statusBadge = '<span class="badge badge-gold">Pending Verification</span>';
          if (u.kycStatus === 'verified') statusBadge = '<span class="badge badge-green">Verified Driver</span>';
          if (u.kycStatus === 'rejected') statusBadge = '<span class="badge badge-red">Rejected</span>';
          if (u.kycStatus === 'unverified') statusBadge = '<span class="badge badge-red">Unverified</span>';

          return `
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:0.6rem;">
                  <img src="${u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;" />
                  <div>
                    <strong>${u.name}</strong>
                    <div style="font-size:0.75rem; color:var(--text-dim);">${u.email}</div>
                  </div>
                </div>
              </td>
              <td><span class="badge badge-indigo">${u.role.toUpperCase()}</span></td>
              <td><code>${u.driverLicenseNumber || u.kycDocuments?.idNumber || 'DL-PENDING'}</code></td>
              <td>${statusBadge}</td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="AdminController.previewDocument('${docImg}', '${u.name}')">
                  🔍 Inspect Document
                </button>
              </td>
              <td>
                <div style="display:flex; gap:0.35rem;">
                  <button class="btn btn-success btn-sm" onclick="AdminController.verifyKYC('${u._id}', 'verified')">
                    ✓ Approve
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="AdminController.verifyKYC('${u._id}', 'rejected')">
                    ✕ Reject
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" style="color:var(--accent-red); text-align:center;">Error: ${err.message}</td></tr>`;
    }
  },

  async verifyKYC(userId, status) {
    let reason = '';
    if (status === 'rejected') {
      reason = prompt('Enter rejection reason:') || 'Documents did not meet agency verification standards.';
    }

    try {
      const res = await API.admin.verifyKYC(userId, status, reason);
      if (res.success) {
        Toast.success(res.message);
        this.loadKYCQueue();
        this.loadMetrics();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  // 2. Vehicle Verification Queue
  async loadCarsQueue() {
    const tableBody = document.getElementById('admin-cars-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;"><div class="badge badge-gold">⚡ Loading Fleet Queue...</div></td></tr>`;

    try {
      const res = await API.admin.getCarsQueue();
      if (res.success) {
        const cars = res.data;
        if (cars.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;">No vehicles found.</td></tr>`;
          return;
        }

        tableBody.innerHTML = cars.map((c) => {
          const img = c.images && c.images[0] ? c.images[0] : '';
          let statusBadge = '<span class="badge badge-gold">Pending Safety Inspection</span>';
          if (c.verificationStatus === 'approved') statusBadge = '<span class="badge badge-green">Approved for Fleet</span>';
          if (c.verificationStatus === 'rejected') statusBadge = '<span class="badge badge-red">Rejected</span>';

          return `
            <tr>
              <td>
                <div class="table-car-preview">
                  <img src="${img}" class="table-car-img" />
                  <div>
                    <strong>${c.year} ${c.make} ${c.model}</strong>
                    <div style="font-size:0.75rem; color:var(--text-dim);">${c.category} • $${c.dailyRate}/day</div>
                  </div>
                </div>
              </td>
              <td>${c.host?.name || 'Verified Host'}</td>
              <td>${c.location?.city || 'San Francisco'}, ${c.location?.state || 'CA'}</td>
              <td>
                <div style="font-size:0.8rem;">
                  Reg: <code>${c.vehicleRegistrationNumber || 'REG-PENDING'}</code><br/>
                  Ins: <code>${c.insurancePolicyNumber || 'INS-PENDING'}</code>
                </div>
              </td>
              <td>${statusBadge}</td>
              <td>
                <div style="display:flex; gap:0.35rem;">
                  <button class="btn btn-success btn-sm" onclick="AdminController.verifyCar('${c._id}', 'approved')">
                    ✓ Approve Listing
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="AdminController.verifyCar('${c._id}', 'rejected')">
                    ✕ Reject
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" style="color:var(--accent-red); text-align:center;">Error: ${err.message}</td></tr>`;
    }
  },

  async verifyCar(carId, status) {
    let reason = '';
    if (status === 'rejected') {
      reason = prompt('Enter vehicle rejection reason:') || 'Failed safety or insurance paperwork verification.';
    }

    try {
      const res = await API.admin.verifyCar(carId, status, reason);
      if (res.success) {
        Toast.success(res.message);
        this.loadCarsQueue();
        this.loadMetrics();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  // 3. All Bookings & Dispute Mediation
  async loadBookingsQueue() {
    const tableBody = document.getElementById('admin-bookings-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem;"><div class="badge badge-cyan">⚡ Loading Platform Bookings...</div></td></tr>`;

    try {
      const res = await API.admin.getAllBookings();
      if (res.success) {
        const bookings = res.data;
        if (bookings.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem;">No bookings found.</td></tr>`;
          return;
        }

        tableBody.innerHTML = bookings.map((b) => {
          const car = b.car || {};
          const isDisputed = b.dispute?.isDisputed && b.dispute?.status === 'open';

          return `
            <tr>
              <td><code>#${b._id.substring(b._id.length - 8).toUpperCase()}</code></td>
              <td>${car.year || ''} ${car.make || ''} ${car.model || 'Vehicle'}</td>
              <td>${b.renter?.name || 'Renter'}</td>
              <td>${b.host?.name || 'Host'}</td>
              <td><strong style="color:#ffffff;">${API.formatMoney(b.totalAmount)}</strong> (Fee: ${API.formatMoney(b.serviceFee)})</td>
              <td>
                <span class="badge ${b.status === 'completed' ? 'badge-green' : b.status === 'active' ? 'badge-cyan' : 'badge-gold'}">
                  ${b.status.toUpperCase()}
                </span>
                ${isDisputed ? '<span class="badge badge-red" style="margin-left:0.3rem;">⚠️ DISPUTE</span>' : ''}
              </td>
              <td>
                ${isDisputed ? `
                  <button class="btn btn-warning btn-sm" onclick="AdminController.openDisputeResolver('${b._id}', '${b.dispute.reason}')">
                    ⚖️ Resolve Dispute
                  </button>
                ` : `
                  <span style="font-size:0.8rem; color:var(--text-dim);">Escrow: ${b.paymentStatus}</span>
                `}
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" style="color:var(--accent-red); text-align:center;">Error: ${err.message}</td></tr>`;
    }
  },

  // 4. Financial Transactions Ledger
  async loadTransactionsQueue() {
    const tableBody = document.getElementById('admin-transactions-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;"><div class="badge badge-cyan">⚡ Loading Transaction Ledger...</div></td></tr>`;

    try {
      const res = await API.admin.getAllTransactions();
      if (res.success) {
        const txs = res.data;
        if (txs.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;">No transactions logged yet.</td></tr>`;
          return;
        }

        tableBody.innerHTML = txs.map((tx) => {
          const date = new Date(tx.createdAt).toLocaleString();
          let typeColor = 'badge-cyan';
          if (tx.type === 'host_payout') typeColor = 'badge-green';
          if (tx.type === 'agency_commission') typeColor = 'badge-gold';
          if (tx.type === 'refund') typeColor = 'badge-red';

          return `
            <tr>
              <td><code>${tx.referenceId}</code></td>
              <td><span class="badge ${typeColor}">${tx.type.replace('_', ' ').toUpperCase()}</span></td>
              <td><strong style="color:#ffffff;">${API.formatMoney(tx.amount)}</strong></td>
              <td>${tx.user?.name || 'Platform User'} (${tx.user?.role || 'user'})</td>
              <td style="font-size:0.82rem; color:var(--text-muted);">${tx.description}</td>
              <td style="font-size:0.78rem; color:var(--text-dim);">${date}</td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" style="color:var(--accent-red); text-align:center;">Error: ${err.message}</td></tr>`;
    }
  },

  previewDocument(imgUrl, userName) {
    const modal = document.getElementById('doc-preview-modal');
    const img = document.getElementById('doc-preview-image');
    const title = document.getElementById('doc-preview-title');
    if (!modal) return;

    img.src = imgUrl;
    title.textContent = `Driver Document Inspection: ${userName}`;
    modal.classList.add('active');
  },

  async openDisputeResolver(bookingId, disputeReason) {
    const action = prompt(`Intermediary Agency Adjudication for Booking #${bookingId}\nReason: "${disputeReason}"\n\nEnter Action:\n1. 'refund_renter' - Full Escrow Refund to Renter\n2. 'payout_host' - Release Payout to Host\n3. 'dismiss' - Dismiss Dispute`);
    if (!action) return;

    try {
      const res = await API.admin.resolveDispute(bookingId, action, `Adjudicated by agency admin with action: ${action}`);
      if (res.success) {
        Toast.success(res.message);
        this.loadBookingsQueue();
        this.loadMetrics();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },
};

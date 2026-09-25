// ==========================================================================
// RentPeer - Main Application Orchestrator & View Router
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  init() {
    // 1. Initialize Sub-Controllers
    AuthController.init();
    CarsController.init();
    BookingsController.init();
    HostController.init();
    AdminController.init();

    // 2. Wire State Change Listeners
    State.on('userChanged', (user) => this.handleUserStateChange(user));
    State.on('viewChanged', (view) => this.renderView(view));

    // 3. Navigation Links
    this.bindNavigation();

    // 4. Initial View Render
    this.renderView(State.currentView);
  },

  bindNavigation() {
    // Top Nav Links
    const exploreNav = document.getElementById('nav-explore-btn');
    const howItWorksNav = document.getElementById('nav-how-btn');
    const safetyNav = document.getElementById('nav-safety-btn');

    if (exploreNav) {
      exploreNav.addEventListener('click', (e) => {
        e.preventDefault();
        State.setView('explore');
      });
    }

    if (howItWorksNav) {
      howItWorksNav.addEventListener('click', (e) => {
        e.preventDefault();
        State.setView('explore');
        const sec = document.getElementById('how-it-works-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (safetyNav) {
      safetyNav.addEventListener('click', (e) => {
        e.preventDefault();
        State.setView('explore');
        const sec = document.getElementById('agency-trust-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // User Dropdown View switchers
    const dropdownRenter = document.getElementById('menu-item-renter');
    const dropdownHost = document.getElementById('menu-item-host');
    const dropdownAdmin = document.getElementById('menu-item-admin');
    const dropdownKYC = document.getElementById('menu-item-kyc');

    if (dropdownRenter) {
      dropdownRenter.addEventListener('click', (e) => {
        e.preventDefault();
        State.setView('renter-dash');
      });
    }
    if (dropdownHost) {
      dropdownHost.addEventListener('click', (e) => {
        e.preventDefault();
        State.setView('host-dash');
      });
    }
    if (dropdownAdmin) {
      dropdownAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        State.setView('admin-dash');
      });
    }
    if (dropdownKYC) {
      dropdownKYC.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = document.getElementById('kyc-modal');
        if (modal) modal.classList.add('active');
      });
    }

    // Role switcher buttons in header
    const roleRenterBtn = document.getElementById('role-btn-renter');
    const roleHostBtn = document.getElementById('role-btn-host');
    const roleAdminBtn = document.getElementById('role-btn-admin');

    if (roleRenterBtn) {
      roleRenterBtn.addEventListener('click', () => {
        State.setView('renter-dash');
      });
    }
    if (roleHostBtn) {
      roleHostBtn.addEventListener('click', () => {
        State.setView('host-dash');
      });
    }
    if (roleAdminBtn) {
      roleAdminBtn.addEventListener('click', () => {
        State.setView('admin-dash');
      });
    }
  },

  handleUserStateChange(user) {
    const guestActions = document.getElementById('guest-nav-actions');
    const userMenu = document.getElementById('user-profile-menu');
    const userAvatar = document.getElementById('header-user-avatar');
    const userName = document.getElementById('header-user-name');
    const userRoleBadge = document.getElementById('header-user-role-badge');
    const roleNavContainer = document.getElementById('role-nav-switcher');

    if (user) {
      if (guestActions) guestActions.style.display = 'none';
      if (userMenu) userMenu.style.display = 'block';
      if (roleNavContainer) roleNavContainer.style.display = 'flex';

      if (userAvatar) userAvatar.src = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
      if (userName) userName.textContent = user.name.split(' ')[0];
      if (userRoleBadge) {
        userRoleBadge.textContent = user.role.toUpperCase();
        userRoleBadge.className = `badge ${user.role === 'admin' ? 'badge-gold' : user.role === 'host' ? 'badge-indigo' : 'badge-cyan'}`;
      }

      // Update Renter KYC Status Badge if in view
      this.updateKYCBanner(user);
    } else {
      if (guestActions) guestActions.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';
      if (roleNavContainer) roleNavContainer.style.display = 'none';
    }
  },

  updateKYCBanner(user) {
    const kycBanner = document.getElementById('renter-kyc-banner');
    const kycText = document.getElementById('renter-kyc-status-text');
    const kycBtn = document.getElementById('renter-kyc-action-btn');

    if (!kycBanner || !user) return;

    if (user.kycStatus === 'verified') {
      kycText.innerHTML = '<strong>Verified Driver Status: Active</strong>. You are certified by the Intermediary Agency to book any vehicle.';
      if (kycBtn) kycBtn.style.display = 'none';
    } else if (user.kycStatus === 'pending') {
      kycText.innerHTML = '<strong>Driver License Pending Agency Verification</strong>. Our trust & safety team is inspecting your submission.';
      if (kycBtn) {
        kycBtn.textContent = 'Verification In Progress';
        kycBtn.disabled = true;
      }
    } else {
      kycText.innerHTML = '<strong>Unverified Driver</strong>: Submit your Driver\'s License to unlock instant booking on high-performance & luxury fleet.';
      if (kycBtn) {
        kycBtn.textContent = 'Submit ID for Verification';
        kycBtn.disabled = false;
        kycBtn.onclick = () => {
          document.getElementById('kyc-modal').classList.add('active');
        };
      }
    }
  },

  renderView(view) {
    const viewExplore = document.getElementById('view-explore');
    const viewRenter = document.getElementById('view-renter');
    const viewHost = document.getElementById('view-host');
    const viewAdmin = document.getElementById('view-admin');

    const roleRenter = document.getElementById('role-btn-renter');
    const roleHost = document.getElementById('role-btn-host');
    const roleAdmin = document.getElementById('role-btn-admin');

    // Reset view states
    if (viewExplore) viewExplore.style.display = view === 'explore' ? 'block' : 'none';
    if (viewRenter) viewRenter.classList.toggle('active', view === 'renter-dash');
    if (viewHost) viewHost.classList.toggle('active', view === 'host-dash');
    if (viewAdmin) viewAdmin.classList.toggle('active', view === 'admin-dash');

    // Update active role button highlight
    if (roleRenter) roleRenter.className = `role-btn role-nav-btn ${view === 'renter-dash' ? 'active' : ''}`;
    if (roleHost) roleHost.className = `role-btn role-nav-btn ${view === 'host-dash' ? 'active-host' : ''}`;
    if (roleAdmin) roleAdmin.className = `role-btn role-nav-btn ${view === 'admin-dash' ? 'active-admin' : ''}`;

    // Load data for active view
    if (view === 'explore') {
      CarsController.loadCars();
    } else if (view === 'renter-dash') {
      BookingsController.loadRenterDashboard();
      if (State.currentUser) this.updateKYCBanner(State.currentUser);
    } else if (view === 'host-dash') {
      HostController.loadHostDashboard();
    } else if (view === 'admin-dash') {
      AdminController.loadAdminDashboard();
    }

    // Scroll window to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};

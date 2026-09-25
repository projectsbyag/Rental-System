// ==========================================================================
// RentPeer - Authentication & User Session Controller
// ==========================================================================

const AuthController = {
  init() {
    this.checkSession();
    this.bindEvents();
  },

  async checkSession() {
    const token = API.getToken();
    if (!token) {
      State.setUser(null);
      return;
    }

    try {
      const res = await API.auth.getMe();
      if (res.success && res.user) {
        State.setUser(res.user);
      } else {
        API.setToken('');
        State.setUser(null);
      }
    } catch (err) {
      API.setToken('');
      State.setUser(null);
    }
  },

  bindEvents() {
    // Open Auth Modal button
    const openAuthBtn = document.getElementById('open-auth-modal-btn');
    if (openAuthBtn) {
      openAuthBtn.addEventListener('click', () => this.showModal('login'));
    }

    // Modal Close buttons
    const closeBtns = document.querySelectorAll('.close-modal-trigger');
    closeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Toggle Login / Register tab in modal
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => this.switchTab('login'));
      tabRegister.addEventListener('click', () => this.switchTab('register'));
    }

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Register Form Submit
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Quick Demo Logins
    const demoAdminBtn = document.getElementById('demo-login-admin');
    const demoHostBtn = document.getElementById('demo-login-host');
    const demoRenterBtn = document.getElementById('demo-login-renter');

    if (demoAdminBtn) {
      demoAdminBtn.addEventListener('click', () => this.quickLogin('admin@rentpeer.com', 'admin123'));
    }
    if (demoHostBtn) {
      demoHostBtn.addEventListener('click', () => this.quickLogin('host@rentpeer.com', 'host123'));
    }
    if (demoRenterBtn) {
      demoRenterBtn.addEventListener('click', () => this.quickLogin('renter@rentpeer.com', 'renter123'));
    }

    // User Avatar Menu Dropdown Toggle
    const avatarBtn = document.getElementById('user-avatar-btn');
    const dropdown = document.getElementById('user-dropdown-menu');
    if (avatarBtn && dropdown) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('show');
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-action-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Role Quick Switch Buttons (Top Nav Bar)
    const roleBtns = document.querySelectorAll('.role-nav-btn');
    roleBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetRole = btn.dataset.role;
        if (!State.currentUser) {
          Toast.info(`Please log in first to access the ${targetRole} portal.`);
          this.showModal('login');
          return;
        }
        await this.handleRoleSwitch(targetRole);
      });
    });

    // KYC Verification Submit
    const kycForm = document.getElementById('kyc-submit-form');
    if (kycForm) {
      kycForm.addEventListener('submit', (e) => this.handleKYCSubmit(e));
    }
  },

  showModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    this.switchTab(tab);
    modal.classList.add('active');
  },

  switchTab(tab) {
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const formLogin = document.getElementById('login-form-container');
    const formRegister = document.getElementById('register-form-container');

    if (tab === 'login') {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.style.display = 'block';
      formRegister.style.display = 'none';
    } else {
      tabLogin.classList.remove('active');
      tabRegister.classList.add('active');
      formLogin.style.display = 'none';
      formRegister.style.display = 'block';
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const res = await API.auth.login({ email, password });
      if (res.success) {
        API.setToken(res.token);
        State.setUser(res.user);
        document.getElementById('auth-modal').classList.remove('active');
        Toast.success(`Welcome back, ${res.user.name}!`);
        this.routeUserAfterLogin(res.user);
      }
    } catch (err) {
      Toast.error(err.message || 'Login failed.');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    try {
      const res = await API.auth.register({ name, email, phone, password, role });
      if (res.success) {
        API.setToken(res.token);
        State.setUser(res.user);
        document.getElementById('auth-modal').classList.remove('active');
        Toast.success(`Account created! Welcome to RentPeer, ${res.user.name}.`);
        this.routeUserAfterLogin(res.user);
      }
    } catch (err) {
      Toast.error(err.message || 'Registration failed.');
    }
  },

  async quickLogin(email, password) {
    try {
      const res = await API.auth.login({ email, password });
      if (res.success) {
        API.setToken(res.token);
        State.setUser(res.user);
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.remove('active');
        Toast.success(`Logged in as ${res.user.role.toUpperCase()}: ${res.user.name}`);
        this.routeUserAfterLogin(res.user);
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async handleRoleSwitch(role) {
    try {
      const res = await API.auth.switchRole(role);
      if (res.success) {
        State.setUser(res.user);
        Toast.info(`Switched active portal to: ${role.toUpperCase()}`);
        this.routeUserAfterLogin(res.user);
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async handleKYCSubmit(e) {
    e.preventDefault();
    const licenseNumber = document.getElementById('kyc-license-num').value.trim();
    const idType = document.getElementById('kyc-id-type').value;
    const docFile = document.getElementById('kyc-doc-file').files[0];

    const formData = new FormData();
    formData.append('driverLicenseNumber', licenseNumber);
    formData.append('idType', idType);
    if (docFile) {
      formData.append('documentImage', docFile);
    }

    try {
      const res = await API.auth.submitKYC(formData);
      if (res.success) {
        State.setUser(res.user);
        const modal = document.getElementById('kyc-modal');
        if (modal) modal.classList.remove('active');
        Toast.success('Documents submitted! The Intermediary Agency will verify your driving credentials shortly.');
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  logout() {
    API.setToken('');
    State.setUser(null);
    State.setView('explore');
    Toast.info('Logged out successfully.');
  },

  routeUserAfterLogin(user) {
    if (user.role === 'admin') {
      State.setView('admin-dash');
    } else if (user.role === 'host') {
      State.setView('host-dash');
    } else {
      State.setView('explore');
    }
  },
};

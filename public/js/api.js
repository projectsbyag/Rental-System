// ==========================================================================
// RentPeer - API Client Service
// ==========================================================================

const API = {
  baseURL: '',

  getToken() {
    return localStorage.getItem('rentpeer_token') || '';
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('rentpeer_token', token);
    } else {
      localStorage.removeItem('rentpeer_token');
    }
  },

  getHeaders(isJSON = true) {
    const headers = {};
    if (isJSON) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options.body instanceof FormData;

    const config = {
      ...options,
      headers: {
        ...this.getHeaders(!isFormData),
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  },

  // Auth Endpoints
  auth: {
    login: (credentials) => API.request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => API.request('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => API.request('/api/auth/me'),
    updateProfile: (data) => API.request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
    submitKYC: (formData) => API.request('/api/auth/kyc', { method: 'POST', body: formData }),
    switchRole: (role) => API.request('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role }) }),
  },

  // Cars Endpoints
  cars: {
    getAll: (params = {}) => {
      const cleanParams = {};
      Object.keys(params).forEach((k) => {
        if (params[k] !== '' && params[k] !== null && params[k] !== undefined && params[k] !== 'All') {
          cleanParams[k] = params[k];
        }
      });
      const query = new URLSearchParams(cleanParams).toString();
      return API.request(`/api/cars${query ? `?${query}` : ''}`);
    },
    getById: (id) => API.request(`/api/cars/${id}`),
    create: (carData) => {
      if (carData instanceof FormData) {
        return API.request('/api/cars', { method: 'POST', body: carData });
      }
      return API.request('/api/cars', { method: 'POST', body: JSON.stringify(carData) });
    },
    update: (id, carData) => API.request(`/api/cars/${id}`, { method: 'PUT', body: JSON.stringify(carData) }),
    delete: (id) => API.request(`/api/cars/${id}`, { method: 'DELETE' }),
    getMyFleet: () => API.request('/api/cars/my-fleet'),
    toggleActive: (id) => API.request(`/api/cars/${id}/toggle-active`, { method: 'PATCH' }),
  },

  // Bookings Endpoints
  bookings: {
    create: (bookingData) => API.request('/api/bookings', { method: 'POST', body: JSON.stringify(bookingData) }),
    getMyTrips: () => API.request('/api/bookings/my-trips'),
    getHostReservations: () => API.request('/api/bookings/host-reservations'),
    accept: (id) => API.request(`/api/bookings/${id}/accept`, { method: 'PATCH' }),
    decline: (id, reason) => API.request(`/api/bookings/${id}/decline`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
    startTrip: (id, data) => API.request(`/api/bookings/${id}/start-trip`, { method: 'PATCH', body: JSON.stringify(data) }),
    completeTrip: (id, data) => API.request(`/api/bookings/${id}/complete-trip`, { method: 'PATCH', body: JSON.stringify(data) }),
    reportDispute: (id, reason) => API.request(`/api/bookings/${id}/dispute`, { method: 'POST', body: JSON.stringify({ reason }) }),
  },

  // Reviews Endpoints
  reviews: {
    add: (reviewData) => API.request('/api/reviews', { method: 'POST', body: JSON.stringify(reviewData) }),
    getForCar: (carId) => API.request(`/api/reviews/car/${carId}`),
  },

  // Admin Intermediary Endpoints
  admin: {
    getMetrics: () => API.request('/api/admin/metrics'),
    getKYCQueue: () => API.request('/api/admin/kyc-queue'),
    verifyKYC: (userId, status, rejectionReason) => API.request(`/api/admin/kyc/${userId}`, { method: 'PATCH', body: JSON.stringify({ status, rejectionReason }) }),
    getCarsQueue: () => API.request('/api/admin/cars-queue'),
    verifyCar: (carId, status, rejectionReason, isFeatured) => API.request(`/api/admin/cars/${carId}/verify`, { method: 'PATCH', body: JSON.stringify({ status, rejectionReason, isFeatured }) }),
    getAllBookings: () => API.request('/api/admin/bookings'),
    resolveDispute: (id, action, resolutionNotes) => API.request(`/api/admin/bookings/${id}/resolve-dispute`, { method: 'PATCH', body: JSON.stringify({ action, resolutionNotes }) }),
    getAllTransactions: () => API.request('/api/admin/transactions'),
  },
};

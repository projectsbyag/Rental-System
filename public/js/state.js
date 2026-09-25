// ==========================================================================
// RentPeer - Central Reactive State Store
// ==========================================================================

const State = {
  currentUser: null,
  activeRole: 'renter', // 'renter' | 'host' | 'admin'
  currentView: 'explore', // 'explore' | 'renter-dash' | 'host-dash' | 'admin-dash'

  cars: [],
  filters: {
    city: '',
    category: 'All',
    transmission: 'All',
    fuelType: 'All',
    maxPrice: 500000,
    sort: 'recommended',
    startDate: '',
    endDate: '',
    search: '',
  },

  selectedCar: null,
  myTrips: [],
  hostReservations: [],
  hostFleet: [],

  adminMetrics: {},
  adminKYCQueue: [],
  adminCarsQueue: [],
  adminBookings: [],
  adminTransactions: [],

  listeners: {},

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  },

  setUser(user) {
    this.currentUser = user;
    if (user && user.role) {
      this.activeRole = user.role;
    }
    this.emit('userChanged', user);
  },

  setRole(role) {
    this.activeRole = role;
    this.emit('roleChanged', role);
  },

  setView(viewName) {
    this.currentView = viewName;
    this.emit('viewChanged', viewName);
  },

  setCars(cars) {
    this.cars = cars;
    this.emit('carsUpdated', cars);
  },

  setFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.emit('filtersChanged', this.filters);
  },
};

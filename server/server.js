require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const seedDatabase = require('./seed/seedData');

// Route imports
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve Static Uploads and Frontend Assets
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    service: 'RentPeer P2P Car Rental Platform API',
  });
});

// Catch-all route to serve the Single Page App frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start only after the database is ready so the first API request sees seeded data.
const startServer = async () => {
  await connectDB();
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`
🚀 RentPeer P2P Car Rental Platform Server is running!
📡 URL: http://localhost:${PORT}
🚗 Explore vehicles, book trips, manage fleet, and verify documentation.
    `);
  });
};

startServer().catch((err) => {
  console.error('❌ Server startup failed:', err.message);
  process.exit(1);
});

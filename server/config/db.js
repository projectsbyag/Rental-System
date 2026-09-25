const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/p2p_car_rental';
  
  try {
    // Attempt connecting to the configured URI with a short timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`✅ MongoDB Connected to: ${mongoose.connection.host}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Could not connect to local/remote MongoDB (${err.message}).`);
    console.log('🔄 Initializing in-memory MongoDB server for instant zero-config environment...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✅ In-Memory MongoDB Connected at: ${memoryUri}`);
      return true;
    } catch (memErr) {
      console.error('❌ Failed to start in-memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

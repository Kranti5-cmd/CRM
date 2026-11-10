const dns = require('dns');
try {
  // Use public DNS to resolve MongoDB Atlas SRV records smoothly on Windows
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // fallback to system default
}

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

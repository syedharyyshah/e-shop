const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Please check:');
    console.error('1. Your IP is whitelisted in MongoDB Atlas Network Access');
    console.error('2. MongoDB Atlas cluster is running');
    console.error('3. Credentials are correct (URL encode special chars in password)');
    process.exit(1);
  }
};

module.exports = connectDB;
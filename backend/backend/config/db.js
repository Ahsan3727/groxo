const mongoose = require('mongoose');
const { MONGO_URI } = require('./environment');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected: ' + conn.connection.host);
  } catch (err) {
    console.error('MongoDB error: ' + err.message);
    process.exit(1);
  }
};
module.exports = connectDB;

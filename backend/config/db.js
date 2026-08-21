import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    console.error("Check: 1) Your IP is whitelisted in Atlas  2) MONGO_URI is correct  3) Internet connection");
    // Don't exit in development — lets you debug without restarting
    if (process.env.NODE_ENV === "production") process.exit(1);
  }
};

export default connectDB;

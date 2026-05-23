import mongoose from "mongoose";

let dbReady = false;

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn("MONGODB_URI not set. API will run in mock mode.");
    return false;
  }

  try {
    await mongoose.connect(uri);
    dbReady = true;
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    dbReady = false;
    console.error("MongoDB connection failed:", error.message);
    return false;
  }
}

export function isDbReady() {
  return dbReady && mongoose.connection.readyState === 1;
}

import mongoose from "mongoose";
import { logger } from "../config/logger.js";

const DB_URI =
  process.env.DB_URI ||
  "mongodb+srv://wedding:wedding@wedding.5o4lt.mongodb.net/?retryWrites=true&w=majority&appName=wedding";
async function connectDB() {
  try {
    await mongoose.connect(DB_URI);
    logger.info(
      ` data base connected with mongoDb`.blue
    );
  } catch (err) {
    logger.info(
      `⚙️ faild to connect with MONGO DB`.green
    );
  }
}

export default connectDB;

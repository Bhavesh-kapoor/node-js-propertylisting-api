import mongoose from "mongoose";
import { logger } from "../config/logger.js";

const DB_URI = process.env.DB_URI
async function connectDB() {
  try {
    await mongoose.connect(DB_URI);
    logger.info(
      ` data base connected with mongoDb`.blue
    );
  } catch (err) {
    console.log(err)
    logger.info(
      `⚙️ faild to connect with MONGO DB`.green
    );
  }
}

export default connectDB;

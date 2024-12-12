import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import cors from "cors";
import { logger } from "./config/logger.js";
dotenv.config({
  path: "./.env",
});

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Include credentials if necessary (e.g., cookies)
  })
);

  const startServer = async () => {
    try {
      await connectDB();
      app.listen(process.env.PORT || 8000, () => {
        logger.info(
          `⚙️  Server is running at http://localhost:${process.env.PORT}`.green
        );
      });
    } catch (err) {
      logger.error(`Failed to start the server: ${err.message}`);
      process.exit(1);
    }
  };

  startServer()
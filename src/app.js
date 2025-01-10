import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import colors from "colors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { logger } from "./config/logger.js";
import path from "path";
import { fileURLToPath } from "url";
import scheduleCronJobs from "./jobs/subscriptionJob.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use __dirname in your code
app.use(express.static(path.join(__dirname)));
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "http://localhost:6000"); // Replace with your frontend's origin
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });
// Middleware
app.use(helmet());
app.use(cookieParser());
const allowedOrigins = process.env.ALLOWED_ORIGINS;
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};
app.use(cors(corsOptions));
// app.use(cors(corsOptions));

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
app.use((req, res, next) => {
  const startTime = process.hrtime();
  res.on("finish", () => {
    const fetchStatus = () => {
      if (res.statusCode >= 500) return colors.red(`${res.statusCode}`);
      else if (res.statusCode >= 400) return colors.yellow(`${res.statusCode}`);
      else if (res.statusCode >= 300) return colors.cyan(`${res.statusCode}`);
      else if (res.statusCode >= 200) return colors.green(`${res.statusCode}`);
      else return colors.white(`${res.statusCode}`);
    };
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    logger.info(
      `${"METHOD:".blue} ${req.method.yellow} - ${"URL:".blue} ${
        req.originalUrl.yellow
      } - ${"STATUS:".blue} ${fetchStatus()} - ${"Response Time:".blue} ${
        responseTime.magenta
      } ${"ms".magenta}`
    );
  });
  next();
});

/*----------------------------------------------Routes------------------------------------------*/
import integratedRoutes from "./routes/integrated.routes.js";
app.use("/api", integratedRoutes);

/*----------------------------------------------cronjob------------------------------------------*/
scheduleCronJobs();

app.use((request, response) => {
  response.status(404).json({ success: false, message: "Route Not Found" });
});

export { app };

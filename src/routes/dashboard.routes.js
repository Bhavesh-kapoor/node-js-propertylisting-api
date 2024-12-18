import express from "express";
import {
  getOverview,
  getTransactionsByMonth,
  getOverviewByRevenue,
} from "../controller/dashboardController.js";

const dashboardRoutes = express.Router();
dashboardRoutes.get("/overview", getOverview);
dashboardRoutes.get("/transactions", getTransactionsByMonth);
dashboardRoutes.get("/overview-revenue", getOverviewByRevenue);

export default dashboardRoutes;

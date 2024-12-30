import express from "express";
import {
  getCurrentSubscription,
  getAllSubscribedPlans,
  getSubscribedPlanById,
  getSubscribedPlansByUserId,
  deleteSubscribedPlan,
  makePlanActive,
} from "../controller/subscribedPlan.controller.js";
const subscribedPlanRoute = express.Router();

subscribedPlanRoute.get("/get-active/:userId?", getCurrentSubscription);
subscribedPlanRoute.get("/get-all", getAllSubscribedPlans);
subscribedPlanRoute.get("/get-by-id/:id", getSubscribedPlanById);
subscribedPlanRoute.get("/get-by-userId/:userId", getSubscribedPlansByUserId);
subscribedPlanRoute.get("/status-update/:id", makePlanActive);
subscribedPlanRoute.get("/delete/:id", deleteSubscribedPlan);

export default subscribedPlanRoute;

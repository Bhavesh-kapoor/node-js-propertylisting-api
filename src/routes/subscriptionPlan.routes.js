import express from "express";
import {
  createSubscriptionPlan,
  getSubscriptionPlanById,
  getAllSubscriptionPlans,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from "../controller/subscriptionPlan.controller.js";
import { multerUpload } from "../middlewere/multer.middlewere.js";
const subscriptionsPlanRoute = express.Router();

subscriptionsPlanRoute.post(
  "/create",
  multerUpload.single("iconFile"),
  createSubscriptionPlan
);
subscriptionsPlanRoute.get("/get/:id", getSubscriptionPlanById);
subscriptionsPlanRoute.get("/get-list", getAllSubscriptionPlans);
subscriptionsPlanRoute.put(
  "/update/:id",
  multerUpload.single("iconFile"),
  updateSubscriptionPlan
);
subscriptionsPlanRoute.delete("/delete/:id", deleteSubscriptionPlan);

export default subscriptionsPlanRoute;

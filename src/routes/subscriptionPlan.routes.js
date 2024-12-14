import express from 'express';
import { createSubscriptionPlan,getSubscriptionPlanById,getAllSubscriptionPlans,updateSubscriptionPlan,deleteSubscriptionPlan } from '../controller/subscriptionPlan.controller.js';
const subscriptionsPlanRoute = express.Router();

subscriptionsPlanRoute.post("/create",createSubscriptionPlan)
subscriptionsPlanRoute.get("/get/:id",getSubscriptionPlanById)
subscriptionsPlanRoute.get("/get-list",getAllSubscriptionPlans)
subscriptionsPlanRoute.put("/update/:id",updateSubscriptionPlan)
subscriptionsPlanRoute.delete("/delete/:id",deleteSubscriptionPlan)

export default subscriptionsPlanRoute
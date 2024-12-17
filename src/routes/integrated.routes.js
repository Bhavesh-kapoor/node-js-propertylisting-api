import express from "express";
import seoRoutes from "./seo.route.js";
import userRoutes from "./user.route.js";
import dealerRoutes from "./dealer.route.js";
import adminRoutes from "./admin.routes.js";
import publicRoutes from "./public.routes.js";
import verifyJwtToken from "../middlewere/auth.middleware.js";

const integratedRoutes = express.Router();
integratedRoutes.use("/users", verifyJwtToken, userRoutes);
integratedRoutes.use("/public", publicRoutes);
integratedRoutes.use("/public/admin", adminRoutes);
integratedRoutes.use("/admin/seo", verifyJwtToken, seoRoutes);

/*-----------------------------------------reviews Category------------------------------------*/
import reviewRouter from "./review.router.js";
integratedRoutes.use("/reviews", verifyJwtToken, reviewRouter);

/*-----------------------------------------reviews Category------------------------------------*/
integratedRoutes.use("/admin/dealer", verifyJwtToken, dealerRoutes);

/*-----------------------------------------blog------------------------------------*/
import blogRoutes from "./blogs.route.js";
integratedRoutes.use("/blogs", verifyJwtToken, blogRoutes);

/*-----------------------------------------contact us------------------------------------*/
import contactUsRoutes from "./contactUs.router.js";
integratedRoutes.use("/contact-us", contactUsRoutes);

/*-----------------------------------------property------------------------------------*/
import propertyRouter from "./property.routes.js";
integratedRoutes.use("/property", verifyJwtToken, propertyRouter);

/*-----------------------------------------subscription Plan------------------------------------*/
import subscriptionsPlanRoute from "./subscriptionPlan.routes.js";
integratedRoutes.use("/subscription", verifyJwtToken, subscriptionsPlanRoute);
/*-----------------------------------------payment------------------------------------*/
import paymentRoute from "./payment.routes.js";
integratedRoutes.use("/payment", verifyJwtToken, paymentRoute);

/*-----------------------------------------device id------------------------------------*/
import deviceRouter from "./deviceId.routes.js";
integratedRoutes.use("/device-id", deviceRouter);

export default integratedRoutes;

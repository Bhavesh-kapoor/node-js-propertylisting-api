import express from "express";
import userRoutes from "./user.route.js"
import publicRoutes from "./public.routes.js"
import adminRoutes from "./admin.routes.js";
import verifyJwtToken from "../middlewere/auth.middleware.js";

const integratedRoutes = express.Router();
integratedRoutes.use("/users", verifyJwtToken, userRoutes)
integratedRoutes.use("/public", publicRoutes)
integratedRoutes.use("/public/admin", adminRoutes)

/*-----------------------------------------reviews Category------------------------------------*/
import reviewRouter from "./review.router.js";
integratedRoutes.use("/reviews", verifyJwtToken, reviewRouter)

/*-----------------------------------------blog------------------------------------*/
import blogRoutes from "./blogs.route.js"
integratedRoutes.use("/blogs", verifyJwtToken, blogRoutes)
export default integratedRoutes;

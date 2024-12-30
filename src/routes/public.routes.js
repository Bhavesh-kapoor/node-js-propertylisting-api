import express from "express";
import { multerUpload } from "../middlewere/multer.middlewere.js";
import {
  registerUser,
  loginUser,
  userValidations,
  loginWithMobile,
  loginAdmin,
  deleteAdmin,
  updateAdminDetails,
  getAdminDetails,
} from "../controller/admin.controller.js";
import {
  sendOtpMobile,
  verifyMobileOtp,
  sendOtpEmail,
  verifyEmailOtp,
} from "../controller/otp.controller.js";
import verifyJwtToken from "../middlewere/auth.middleware.js";

const router = express.Router();

/*----------------------------------------user api----------------------------------------------------*/
router.post(
  "/signup",
  multerUpload.single("profileImage"),
  userValidations,
  registerUser
);
router.post("/login", loginUser);
router.post("/admin-login", loginAdmin);
router.post("/mobile-login", loginWithMobile);
router.delete("/delete/:_id", verifyJwtToken, deleteAdmin);
router.put(
  "/update/:id",
  verifyJwtToken,
  multerUpload.single("profileImage"),
  updateAdminDetails
);
router.get("/get-admin-details/:id", verifyJwtToken, getAdminDetails);

/*----------------------------------------------------otp-----------------------------------------------*/

router.post("/send-mobile-otp", sendOtpMobile);
router.post("/verify-mobile-otp", verifyMobileOtp);
router.post("/send-email-otp", sendOtpEmail);
router.post("/verify-email-otp", verifyEmailOtp);

/*----------------------------------------------------subscription plan list-----------------------------------------------*/
import { getAllSubscriptionPlans } from "../controller/subscriptionPlan.controller.js";
router.get("/get-subscription-plans", getAllSubscriptionPlans);

/*---------------------------------------------------get property list-------------------------*/
import {
  getProperties,
  getProperty,
  getSimilarProperties,
  getPropertyBySlug,
} from "../controller/property.controller.js";
router.get("/get-properties", getProperties);
router.get("/get-similar-properties/:propertyId", getSimilarProperties);
router.get("/get-property/:id", getProperty);
router.get("/get-by-slug/:slug", getPropertyBySlug);

/*-------------------------------------property query---------------------------------------*/
import { raisePropertyQuery } from "../controller/proprtyQuery.controller.js";
router.post("/raise-property-query", raisePropertyQuery);

/*-------------------------------------blog---------------------------------------*/
import { findBlogById, getAllBlogs } from "../controller/BlogsController.js";
router.get("/all-blogs", getAllBlogs);
router.get("/get-blog/:_id", findBlogById);

export default router;

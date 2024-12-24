import express from "express";
import { multerUpload } from "../middlewere/multer.middlewere.js";
import {
  createReview,
  getReviewsByProperty,
  getReviewById,
  deleteReview,
  editReview,
  getAllReviews,
} from "../controller/reviews.controller.js";

const reviewRouter = express.Router();

reviewRouter.post("/create", multerUpload.single("image"), createReview);
reviewRouter.get("/get-by-property/:propertyId", getReviewsByProperty);
reviewRouter.put("/edit/:id", multerUpload.single("image"), editReview);
reviewRouter.delete("/delete/:id", deleteReview);
reviewRouter.get("/get-by-id/:reviewId", getReviewById);
reviewRouter.get("/get-all", getAllReviews);

export default reviewRouter;

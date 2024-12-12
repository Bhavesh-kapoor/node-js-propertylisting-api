import express from 'express';
import { multerUpload } from '../middlewere/multer.middlewere.js';
import { createReview, editReview, getReviewsByPhotographer, deleteReview, getReviewById } from '../controller/reviews.controller.js';

const reviewRouter = express.Router();

reviewRouter.post('/create', multerUpload.single('image'), createReview);

reviewRouter.get('/get/:photographerId', getReviewsByPhotographer);
reviewRouter.get('/get-by-id/:reviewId', getReviewById);

reviewRouter.put('/edit/:id', multerUpload.single('image'), editReview);

reviewRouter.delete('/delete/:id', deleteReview);

export default reviewRouter;

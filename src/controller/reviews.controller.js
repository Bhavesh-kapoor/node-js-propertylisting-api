import { Review } from '../model/reviews.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import s3ServiceWithProgress from '../config/awsS3.config.js';
import mongoose from 'mongoose';

const s3Service = new s3ServiceWithProgress();

/*------------------------------------------------Create a Review---------------------------------------------*/

const createReview = asyncHandler(async (req, res) => {
    const { photographerId, stars, comment } = req.body;
    const userId = req.user._id;
    let imageUrl;

    if (!userId || !photographerId || !stars) {
        throw new ApiError(400, "Required fields: stars, comment");
    }

    if (req.file) {
        const s3Path = `review_image_${Date.now()}_${req.file.originalname}`;
        const fileUrl = await s3Service.uploadFile(req.file, s3Path);
        imageUrl = fileUrl.url;
    }

    const review = new Review({
        userId,
        photographerId,
        stars,
        comment,
        imageUrl
    });

    const savedReview = await review.save();
    res.status(201).json(new ApiResponse(201, savedReview, "Review created successfully"));
});

/*--------------------------------------------------Get All Reviews----------------------------------*/
const getReviewsByPhotographer = asyncHandler(async (req, res) => {
    const { photographerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    if (!photographerId) {
        throw new ApiError(400, "Photographer ID is required");
    }

    const pipeline = [
        {
            $match: { photographerId: new mongoose.Types.ObjectId(photographerId) }
        },

        {
            $sort: { createdAt: -1 }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        {
            $unwind: {
                path: '$userDetails',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: '$photographerId',
                totalReviews: { $sum: 1 },
                averageStars: { $avg: '$stars' },
                reviews: { $push: '$$ROOT' }
            }
        },
        {
            $project: {
                averageStars: { $round: ['$averageStars', 2] },
                totalReviews: 1,
                reviews: {
                    $slice: ['$reviews', skip, limitNumber]
                }
            }
        }
    ];

    // Execute aggregation
    const result = await Review.aggregate(pipeline);

    if (!result || result.length === 0) {
        throw new ApiError(404, "No reviews found for this photographer");
    }

    const reviews = result[0].reviews.map(review => ({
        reviewId: review._id,
        userName: review.userDetails?.name || "Anonymous",
        photographerId: review.photographerId,
        stars: review.stars,
        image: review.image,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
    }));

    res.status(200).json(new ApiResponse(200, {
        reviews,
        pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(result[0].totalReviews / limitNumber),
            totalItems: result[0].totalReviews,
            itemsPerPage: limitNumber,
        },
        averageStars: result[0].averageStars,
    }, "Reviews fetched successfully"));
});


const editReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stars, comment } = req.body;
    let imageUrl;

    const review = await Review.findById(id);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    if (stars) review.stars = stars;
    if (comment) review.comment = comment;

    if (req.file) {
        const s3Path = `review_image_${Date.now()}_${req.file.originalname}`;
        const fileUrl = await s3Service.uploadFile(req.file, s3Path);
        imageUrl = fileUrl.url;

        if (review.imageUrl) {
            await s3Service.deleteFile(review.imageUrl);
        }

        review.imageUrl = imageUrl;
    }

    const updatedReview = await review.save();
    res.status(200).json(new ApiResponse(200, updatedReview, "Review updated successfully"));
});

const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    if (review.imageUrl) {
        try {
            await s3Service.deleteFile(review.imageUrl);
        } catch (err) {
            throw new ApiError(500, "Error deleting associated image from S3");
        }
    }

    await Review.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, null, "Review deleted successfully"));
});


const getReviewById = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    if (!reviewId) {
        throw new ApiError(400, "Review ID is required");
    }

    const review = await Review.findById(reviewId).populate('userId', 'name');

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    const response = {
        reviewId: review._id,
        userName: review.userId?.name || "Anonymous",
        photographerId: review.photographerId,
        stars: review.stars,
        image: review.image,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
    };

    res.status(200).json(new ApiResponse(200, response, "Review fetched successfully"));
});
export { createReview, getReviewsByPhotographer, editReview, deleteReview,getReviewById }
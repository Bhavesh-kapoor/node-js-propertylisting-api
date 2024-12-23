import { Review } from "../model/reviews.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import s3ServiceWithProgress from "../config/awsS3.config.js";
import mongoose from "mongoose";

// Initialize S3 service once
const s3Service = new s3ServiceWithProgress();

// Validation utilities
const validatePagination = (page, limit) => ({
  pageNumber: Math.max(1, parseInt(page) || 1),
  limitNumber: Math.min(100, Math.max(1, parseInt(limit) || 10)),
});

const validateId = (id, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName} format`);
  }
  return true;
};

const createReview = asyncHandler(async (req, res) => {
  const { propertyId, stars, comment, name, email } = req.body;

  const imageUrl = req.file
    ? (
        await s3Service.uploadFile(
          req.file,
          `reviews/review_image_${Date.now()}_${req.file.originalname}`
        )
      ).url
    : null;

  // Create and save review in one operation
  const savedReview = await Review.create({
    name,
    email,
    propertyId,
    stars,
    comment,
    imageUrl,
  });

  res
    .status(201)
    .json(new ApiResponse(201, savedReview, "Review created successfully"));
});

const getReviewsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  validateId(propertyId, "Property ID");
  const { pageNumber, limitNumber } = validatePagination(page, limit);

  const pipeline = [
    { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
    {
      $facet: {
        metadata: [
          {
            $group: {
              _id: null,
              totalReviews: { $sum: 1 },
              averageStars: { $avg: "$stars" },
            },
          },
        ],
        reviews: [
          { $sort: { createdAt: -1 } },
          { $skip: (pageNumber - 1) * limitNumber },
          { $limit: limitNumber },
          // {
          //     $lookup: {
          //         from: 'users',
          //         let: { userId: '$userId' },
          //         pipeline: [
          //             { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
          //             { $project: { name: 1, _id: 0 } }
          //         ],
          //         as: 'userDetails'
          //     }
          // }
        ],
      },
    },
  ];

  const [result] = await Review.aggregate(pipeline);

  if (!result.metadata.length) {
    throw new ApiError(404, "No reviews found for this property");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        result: result.reviews.map((review) => ({
          reviewId: review._id,
          userName: review.name,
          userEmail: review.email,
          propertyId: review.propertyId,
          stars: review.stars,
          imageUrl: review.imageUrl,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        })),
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(result.metadata[0].totalReviews / limitNumber),
          totalItems: result.metadata[0].totalReviews,
          itemsPerPage: limitNumber,
        },
        averageStars: Number(result.metadata[0].averageStars.toFixed(2)),
      },
      "Reviews fetched successfully"
    )
  );
});

const editReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stars, comment } = req.body;

  validateId(id, "Review ID");

  // Find and update in one operation
  const review = await Review.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        ...(stars && { stars }),
        ...(comment && { comment }),
      },
    },
    { new: true, runValidators: true }
  );

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Handle image update if present
  if (req.file) {
    const newImageUrl = (
      await s3Service.uploadFile(
        req.file,
        `reviews/review_image_${Date.now()}_${req.file.originalname}`
      )
    ).url;

    if (review.imageUrl) {
      await s3Service.deleteFile(review.imageUrl).catch(console.error);
    }

    review.imageUrl = newImageUrl;
    await review.save();
  }

  res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated successfully"));
});

const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  validateId(id, "Review ID");

  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Delete image and review in parallel if image exists
  await Promise.all([
    Review.deleteOne({ _id: id }),
    review.imageUrl
      ? s3Service.deleteFile(review.imageUrl).catch(console.error)
      : Promise.resolve(),
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Review deleted successfully"));
});

const getReviewById = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  validateId(reviewId, "Review ID");

  const review = await Review.findById(reviewId)
    .populate("userId", "name")
    .lean();

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        reviewId: review._id,
        userName: review.userId?.name || "Anonymous",
        propertyId: review.propertyId,
        stars: review.stars,
        imageUrl: review.imageUrl,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
      "Review fetched successfully"
    )
  );
});

export {
  createReview,
  getReviewsByProperty,
  editReview,
  deleteReview,
  getReviewById,
};

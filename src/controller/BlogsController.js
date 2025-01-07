import { Blog } from "../model/blogsModel.js";
import { check, validationResult } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import s3ServiceWithProgress from "../config/awsS3.config.js";

const s3Service = new s3ServiceWithProgress();

const validateBlogs = [
  check("title", "Blog title is required!").notEmpty(),
  check("description", "Blog Description is required!").notEmpty(),
  check("shortDescription", "Short description is required!").notEmpty(),
];

const getAllBlogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortkey = "createdAt",
    sortdir = "desc",
    title,
    status,
    endDate,
    startDate,
    searchkey,
    search = "",
    category,
  } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;
  const matchStage = {};
  if (title) {
    matchStage.title = { $regex: title, $options: "i" };
  }
  if (status) {
    matchStage.status = status;
  }
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  if (search && searchkey) {
    matchStage[searchkey] = { $regex: search, $options: "i" };
  }

  const aggregatePipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "categories",
        as: "category",
        localField: "categoryId",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1 } }],
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    { $addFields: { category: "$category.name" } },
    { $sort: { [sortkey]: sortdir === "asc" ? 1 : -1 } },
    { $skip: skip },
    { $limit: limitNumber },
  ];

  if (category) {
    aggregatePipeline.splice(4, 0, {
      $match: { category: { $regex: category, $options: "i" } },
    });
  }

  try {
    const getall = await Blog.aggregate(aggregatePipeline);
    const totalBlogs = await Blog.countDocuments(matchStage);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          result: getall,
          pagination: {
            totalPages: Math.ceil(totalBlogs / limitNumber),
            currentPage: pageNumber,
            totalItems: totalBlogs,
            itemsPerPage: limitNumber,
          },
        },
        "Blog Data Fetch Successfully!"
      )
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const createBlog = asyncHandler(async (req, res) => {
  const { title, description, isActive = true, shortDescription } = req.body;
  const BlogData = {
    title,
    isActive,
    description,
    shortDescription,
  };
  const existingBlog = await Blog.findOne({ title });
  if (existingBlog) {
    throw new ApiError(400, "Blog with this title already exists!");
  }
  if (req.file) {
    const uploadPath = `blogs/${Date.now()}_${req.file.originalname}`;
    const uploadResult = await s3Service.uploadFile(req.file, uploadPath);
    BlogData.imageUrl = uploadResult.url;
  }
  const createdBlog = await Blog.create(BlogData);
  res
    .status(200)
    .json(new ApiResponse(200, createdBlog, "Blogs created Successfully!"));
});

const updateBlog = asyncHandler(async (req, res) => {
  const blogId = req.params._id;
  const { title, description, isActive, shortDescription } = req.body;

  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new ApiError(400, "Invalid Blog ID");
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json(new ApiError(404, "", "Blog not found!"));
  }

  if (req.file) {
    if (blog.imageUrl) {
      await s3Service.deleteFile(blog.imageUrl);
    }
    const uploadPath = `blogs/${Date.now()}_${req.file.originalname}`;
    const uploadResult = await s3Service.uploadFile(req.file, uploadPath);
    blog.imageUrl = uploadResult.url;
  }

  blog.title = title;
  blog.isActive = isActive;
  blog.description = description;
  blog.shortDescription = shortDescription;
  await blog.save();

  return res
    .status(201)
    .json(new ApiResponse(201, blog, "Blog updated successfully!"));
});

const deleteBlog = asyncHandler(async (req, res) => {
  const blogId = req.params._id;
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return res.status(400).json(new ApiError(400, "", "Invalid Blog ID"));
  }

  const blog = await Blog.findByIdAndDelete(blogId);
  if (!blog) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Error while deleting the Blog"));
  }

  if (blog.imageUrl) {
    await s3Service.deleteFile(blog.imageUrl);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "", "Blog deleted successfully!"));
});

const findBlogById = asyncHandler(async (req, res) => {
  const blogId = req.params._id;
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return res.status(400).json(new ApiError(400, "", "Invalid Blog ID"));
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json(new ApiError(404, "", "Blog not found!"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Blog fetched successfully!"));
});

export {
  validateBlogs,
  createBlog,
  getAllBlogs,
  updateBlog,
  deleteBlog,
  findBlogById,
};

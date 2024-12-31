import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { PropertyQuery } from "../model/propertyQuery.model.js";
import { Property } from "../model/property.model.js";
import { isValidObjectId } from "mongoose";
import { sendMail } from "../utils/helper.js";
import { getPropertyQueryTemplate } from "../utils/emailContent.js";
import mongoose from "mongoose";

/*------------------------ Create a new property query-------------------------------*/

const raisePropertyQuery = asyncHandler(async (req, res) => {
  const { senderName, senderEmail, query, senderMobile, propertyId } = req.body;

  // Validate required fields
  if (
    [senderName, senderEmail, query, senderMobile, propertyId].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are mandatory");
  }

  if (!isValidObjectId(propertyId)) {
    throw new ApiError(400, "Invalid property ID");
  }

  const property = await Property.findById(propertyId).populate("owner");
  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  // Create the query
  const propertyQuery = await PropertyQuery.create({
    senderName,
    senderEmail,
    senderMobile,
    query,
    propertyId,
    propertyOwner: property.owner._id,
  });

  // Send email notification to property owner
  const htmlContent = getPropertyQueryTemplate(
    senderName,
    senderEmail,
    senderMobile,
    query,
    property.title
  );
  const subject = `New Property Query from ${senderName}`;
  if (process.env.NODE_ENV === "production") {
    await sendMail(property.owner.email, subject, htmlContent);
    // await sendMail("adarshsrivastav375@gmail.com", subject, htmlContent);
  }
  return res
    .status(201)
    .json(new ApiResponse(201, null, "Query raised successfully"));
});

// Update query status
const updateQueryStatus = asyncHandler(async (req, res) => {
  const { queryId } = req.params;
  const { status } = req.body;

  // Validate queryId
  if (!isValidObjectId(queryId)) {
    throw new ApiError(400, "Invalid query ID");
  }

  // Validate status
  if (!["resolved", "pending", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  // Find and update the query
  const query = await PropertyQuery.findById(queryId);

  if (!query) {
    throw new ApiError(404, "Query not found");
  }

  // Verify if the user is authorized to update the query
  if (
    query.propertyOwner.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Unauthorized to update this query");
  }

  query.status = status;
  await query.save();

  // Optionally send email notification to sender about status update
  const htmlContent = `
        Your property query status has been updated to: ${status}\n
        Query: ${query.query}
    `;

  if (process.env.NODE_ENV !== "production") {
    await sendMail(
      query.senderEmail,
      "Property Query Status Update",
      htmlContent
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, query, "Query status updated successfully"));
});

// Get queries with pagination and filters
const getQueries = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    propertyId,
    sort = "createdAt",
    order = "desc",
  } = req.query;

  const matchStage = {};

  if (status) matchStage.status = status;
  if (propertyId && isValidObjectId(propertyId))
    matchStage.propertyId = new mongoose.Types.ObjectId(propertyId);

  if (req.user.role !== "admin") {
    matchStage.propertyOwner = new mongoose.Types.ObjectId(req.user._id);
  }

  const sortOrder = order === "desc" ? -1 : 1;

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "properties",
        localField: "propertyId",
        foreignField: "_id",
        as: "property",
      },
    },
    { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "propertyOwner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        senderName: 1,
        senderEmail: 1,
        senderMobile: 1,
        query: 1,
        status: 1,
        propertyId: "$property._id",
        propertyTitle: "$property.title",
        propertySlug: "$property.slug",
        ownerId: "$owner._id",
        ownerName: "$owner.name",
        ownerEmail: "$owner.email",
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { [sort]: sortOrder } },
    { $skip: (Number(page) - 1) * Number(limit) },
    { $limit: Number(limit) },
  ];
  const queries = await PropertyQuery.aggregate(pipeline);
  const totalCount = await PropertyQuery.countDocuments(matchStage);

  const pagination = {
    currentPage: Number(page),
    totalPages: Math.ceil(totalCount / limit),
    totalItems: totalCount,
    itemsPerPage: Number(limit),
  };

  if (pagination.currentPage > pagination.totalPages && totalCount > 0) {
    throw new ApiError(404, "Page not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { result: queries, pagination },
        "Queries fetched successfully"
      )
    );
});

// Get query by ID
const getQueryById = asyncHandler(async (req, res) => {
  const { queryId } = req.params;

  if (!isValidObjectId(queryId)) {
    throw new ApiError(400, "Invalid query ID");
  }

  const query = await PropertyQuery.findById(queryId)
    .populate("propertyId", "title slug")
    .populate("propertyOwner", "name email");

  if (!query) {
    throw new ApiError(404, "Query not found");
  }

  // Check if user is authorized to view the query
  if (
    query.propertyOwner._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Unauthorized to view this query");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, query, "Query fetched successfully"));
});

// Delete query
const deleteQuery = asyncHandler(async (req, res) => {
  const { queryId } = req.params;

  if (!isValidObjectId(queryId)) {
    throw new ApiError(400, "Invalid query ID");
  }

  const query = await PropertyQuery.findById(queryId);

  if (!query) {
    throw new ApiError(404, "Query not found");
  }

  // Check if user is authorized to delete the query
  if (
    query.propertyOwner.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Unauthorized to delete this query");
  }

  const deletedQuery = await PropertyQuery.findByIdAndDelete(queryId);
  if (!deletedQuery) {
    throw new ApiError(404, "Query not found!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Query deleted successfully"));
});

export {
  raisePropertyQuery,
  updateQueryStatus,
  getQueries,
  getQueryById,
  deleteQuery,
};

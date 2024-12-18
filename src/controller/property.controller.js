import { Property } from "../model/property.model.js";
import s3ServiceWithProgress from "../config/awsS3.config.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { check, validationResult } from "express-validator";
import { SubscribedPlan } from "../model/subscribedPlan.model.js";
import { addYears } from "date-fns";

const s3Service = new s3ServiceWithProgress();

const propertyValidator = [
  check("title").notEmpty().withMessage("Title is required!"),
  check("description").notEmpty().withMessage("Description is required!"),
  check("price").isNumeric().withMessage("Price must be a number!"),
  check("propertyType")
    .isIn(["House", "Apartment", "Condo", "Villa", "Land"])
    .withMessage("Invalid property type!"),
  check("status")
    .optional()
    .isIn(["For-Sale", "For-Rent", "Sold", "Rented"])
    .withMessage("Invalid status!"),
  check("address.fullAddress")
    .notEmpty()
    .withMessage("Full address is required!"),
  check("address.city").notEmpty().withMessage("City is required!"),
  check("address.state").notEmpty().withMessage("State is required!"),
  check("address.pinCode").notEmpty().withMessage("Postal code is required!"),
  check("address.country").notEmpty().withMessage("Country is required!"),
  check("specifications.landArea")
    .isNumeric()
    .withMessage("Land area must be a number!"),
];

/*---------------------------------------------------Add a new property----------------------------------------*/
const createProperty = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }

  const {
    title,
    description,
    address,
    price,
    propertyType,
    status,
    amenities,
    specifications,
    videoUrl,
  } = req.body;
  const user = req.user;

  const propertyData = {
    title,
    description,
    address,
    price,
    propertyType,
    status,
    amenities,
    specifications,
    videoUrl,
    owner: user._id,
  };
  const currentDate = new Date();

  const activeSubscription = await SubscribedPlan.findOne({
    userId: user._id,
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
    isActive: true,
  });

  if (!activeSubscription) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "No active subscription found! please upgrade the plan"
        )
      );
  }
  if (
    req.files &&
    req.files["imagefiles"] &&
    req.files["imagefiles"].length > 0
  ) {
    const imageUploads = await Promise.all(
      req.files["imagefiles"].map(async (file) => {
        const uploadResult = await s3Service.uploadFile(
          file,
          `properties/${Date.now()}_${file.originalname}`
        );
        return uploadResult.url;
      })
    );
    propertyData.images = imageUploads;
  }

  // Handle single video upload (if any)
  if (req.files && req.files["videofile"]) {
    const videoFile = req.files["videofile"]; // Access single video file directly
    const uploadResult = await s3Service.uploadFile(
      videoFile,
      `properties/videos/${Date.now()}_${videoFile.originalname}`
    );
    propertyData.video = uploadResult.url;
  }

  // Create and save property
  const property = new Property(propertyData);
  await property.save();
  activeSubscription.listed += 1;
  if (activeSubscription.listed === activeSubscription.listed) {
    activeSubscription.isActive = false;
  }
  await activeSubscription.save();
  res
    .status(201)
    .json(new ApiResponse(201, property, "Property created successfully"));
});

/*-------------------------------------------------Get property list----------------------------------------*/
const getProperties = asyncHandler(async (req, res) => {
  const {
    city,
    country,
    name,
    propertyType,
    minPrice,
    maxPrice,
    status,
    amenities,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};

  // Filter by city
  if (city) {
    filter["address.city"] = { $regex: city, $options: "i" };
  }

  // Filter by country
  if (country) {
    filter["address.country"] = { $regex: country, $options: "i" };
  }

  // Filter by name
  if (name) {
    filter.title = { $regex: name, $options: "i" };
  }

  // Filter by property type
  if (propertyType) {
    filter.propertyType = propertyType;
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Filter by status
  if (status) {
    filter.status = status;
  }

  // Filter by amenities (matches all specified amenities)
  if (amenities) {
    const amenitiesArray = amenities.split(",").map((item) => item.trim());
    filter.amenities = { $all: amenitiesArray };
  }

  // Sorting options
  const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // Fetch filtered properties
  const properties = await Property.find(filter)
    .populate({
      path: "owner",
      select: "name email isVerified avatarUrl",
    })
    .sort({ "owner.isVerified": -1, ...sortOptions })
    .skip(skip)
    .limit(limitNumber);
  console.log(properties);
  // Count total properties
  const totalCount = await Property.countDocuments(filter);

  // Respond with data and pagination
  res.status(200).json(
    new ApiResponse(
      200,
      {
        result: properties,
        pagination: {
          totalPages: Math.ceil(totalCount / limitNumber),
          currentPage: pageNumber,
          totalItems: totalCount,
          itemsPerPage: limitNumber,
        },
      },
      "Properties fetched successfully."
    )
  );
});

/*--------------------------------------------Get a single property----------------------------------------*/
const getProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id).populate("owner", "name email");

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, property, "Property fetched successfully."));
});

const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    address,
    price,
    propertyType,
    status,
    features,
    specifications,
    owner,
    images,
    videoUrl,
  } = req.body;

  const property = await Property.findById(id);

  if (!property) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Property not found"));
  }

  // Update text fields
  if (title) property.title = title;
  if (description) property.description = description;
  if (price !== undefined) property.price = price;
  if (propertyType) property.propertyType = propertyType;
  if (status) property.status = status;
  if (features) property.features = features;
  if (owner) property.owner = owner;

  if (address) {
    property.address = {
      ...property.address,
      ...address,
    };
  }

  if (specifications) {
    property.specifications = {
      ...property.specifications,
      ...specifications,
    };
  }

  // Handle new image uploads
  let newImageUrls = [];
  if (
    req.files &&
    req.files["imagefiles"] &&
    req.files["imagefiles"].length > 0
  ) {
    const imageUploads = await Promise.all(
      req.files["imagefiles"].map(async (file) => {
        const uploadResult = await s3Service.uploadFile(
          file,
          `properties/${Date.now()}_${file.originalname}`
        );
        return uploadResult.url;
      })
    );
    newImageUrls = imageUploads; // Store uploaded image URLs
  }

  const existingImageUrls = property.images || [];
  let updatedImages = existingImageUrls;

  if (images) {
    const imagesToKeep = Array.isArray(images) ? images : JSON.parse(images);
    const imagesToRemove = existingImageUrls.filter(
      (existingImage) => !imagesToKeep.includes(existingImage)
    );
    if (imagesToRemove.length > 0) {
      await Promise.all(
        imagesToRemove.map(async (image) => {
          await s3Service.deleteFile(image); // Delete file from S3
        })
      );
    }

    updatedImages = [...imagesToKeep, ...newImageUrls];
  } else if (newImageUrls.length > 0) {
    updatedImages = [...existingImageUrls, ...newImageUrls];
  }
  property.images = updatedImages;

  // Handle video upload (if any)
  if (
    req.files &&
    req.files["videofiles"] &&
    req.files["videofiles"].length > 0
  ) {
    const videoFile = req.files["videofiles"][0]; // Only one video
    const uploadResult = await s3Service.uploadFile(
      videoFile,
      `properties/videos/${Date.now()}_${videoFile.originalname}`
    );
    property.video = uploadResult.url; // Save video URL
  } else if (videoUrl) {
    // If videoUrl is provided in the body, update video with the new URL
    property.video = videoUrl;
  }

  await property.save();

  res
    .status(200)
    .json(new ApiResponse(200, property, "Property updated successfully"));
});

/*-------------------------------------------------- Delete Property--------------------------------*/
const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const property = await Property.findById(id);

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  // Delete images if any
  if (property.images && property.images.length > 0) {
    await Promise.all(
      property.images.map((imageUrl) => s3Service.deleteFile(imageUrl))
    );
  }

  // Delete video if exists
  if (property.video) {
    await s3Service.deleteFile(property.video);
  }

  // Delete the property from the database
  await Property.findByIdAndDelete(id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Property deleted successfully"));
});

export {
  createProperty,
  getProperties,
  updateProperty,
  getProperty,
  propertyValidator,
  deleteProperty,
};

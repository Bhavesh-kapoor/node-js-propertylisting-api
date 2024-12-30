import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Banner } from "../model/banner.model.js";
import { isValidObjectId } from "../utils/helper.js";

const createBanner = asyncHandler(async (req, res) => {
  const { title, description, link, type, isActive } = req.body;
  // if (!req.file) {
  //   throw new ApiError(400, "Banner image is required");
  // }
  // Validate required fields
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  const banner = await Banner.create({
    type,
    title,
    description,
    link: link?.trim(),
    image: req.file?.path,
    isActive: isActive ?? false,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, banner, "Banner created successfully"));
});

// Get all banners with filters
const getBanners = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
    isActive,
  } = req.query;

  const filter = {};

  // Apply isActive filter if provided
  if (typeof isActive !== "undefined") {
    filter.isActive = isActive === "true";
  }

  const banners = await Banner.find(filter)
    .sort({ [sort]: order === "desc" ? -1 : 1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const totalCount = await Banner.countDocuments(filter);

  const pagination = {
    currentPage: Number(page),
    totalPages: Math.ceil(totalCount / limit),
    totalItems: totalCount,
    itemsPerPage: Number(limit),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { banners, pagination },
        "Banners fetched successfully"
      )
    );
});

// Get active banners
const getActiveBanners = asyncHandler(async (req, res) => {
  const { limit = 5, type } = req.query;

  const query = { isActive: true };
  if (type) {
    query.type = type;
  }
  const banners = await Banner.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  return res
    .status(200)
    .json(new ApiResponse(200, banners, "Active banners fetched successfully"));
});

// Get banner by ID
const getBannerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid banner ID");
  }

  const banner = await Banner.findById(id);

  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, banner, "Banner fetched successfully"));
});

// Update banner
const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, link, isActive } = req.body;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid banner ID");
  }

  const banner = await Banner.findById(id);

  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  banner.title = title?.trim() || banner.title;
  banner.description = description?.trim() || banner.description;
  banner.link = link?.trim() || banner.link;

  if (typeof isActive === "boolean") {
    banner.isActive = isActive;
  }

  // Update image if new file is uploaded
  if (req.file) {
    banner.image = req.file.path;
  }

  await banner.save();

  return res
    .status(200)
    .json(new ApiResponse(200, banner, "Banner updated successfully"));
});

// Toggle banner status
const toggleBannerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid banner ID");
  }

  const banner = await Banner.findById(id);

  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  banner.isActive = !banner.isActive;
  await banner.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        banner,
        `Banner ${banner.isActive ? "activated" : "deactivated"} successfully`
      )
    );
});

// Delete banner
const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid banner ID");
  }

  const banner = await Banner.findById(id);

  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  await Banner.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Banner deleted successfully"));
});

// Delete multiple banners
const deleteMultipleBanners = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, "Please provide valid banner IDs");
  }

  // Validate all IDs
  if (ids.some((id) => !isValidObjectId(id))) {
    throw new ApiError(400, "One or more invalid banner IDs");
  }

  const result = await Banner.deleteMany({
    _id: { $in: ids },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedCount: result.deletedCount },
        "Banners deleted successfully"
      )
    );
});

export {
  createBanner,
  getBanners,
  getActiveBanners,
  getBannerById,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
  deleteMultipleBanners,
};

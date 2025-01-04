import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Banner } from "../model/banner.model.js";
import { isValidObjectId } from "../utils/helper.js";
import s3ServiceWithProgress from "../config/awsS3.config.js";

const s3Service = new s3ServiceWithProgress();
const createBanner = asyncHandler(async (req, res) => {
  const { title, description, link, cityName, type, isActive } = req.body;

  if (!req.file) {
    throw new ApiError(400, "Banner image is required");
  }
  let image;
  const s3Path = `banner/${Date.now()}_${req.file.originalname}`;
  const fileUrl = await s3Service.uploadFile(req.file, s3Path);
  image = fileUrl.url;

  const banner = await Banner.create({
    type,
    title,
    cityName: cityName?.trim().toLowerCase(),
    description,
    link: link?.trim() || "",
    image: image,
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
    type,
    cityName,
    isActive,
  } = req.query;

  const filter = {};
  if (type) {
    filter.type = type;
  }
  if (cityName) {
    filter.cityName = { $regex: new RegExp(cityName.trim(), "i") };
  }
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
        { result: banners, pagination },
        "Banners fetched successfully"
      )
    );
});

// Get active banners
const getActiveBanners = asyncHandler(async (req, res) => {
  const { limit = 5, type, cityName } = req.query;

  const query = { isActive: true };
  if (type) {
    query.type = type;
  }
  if (cityName) {
    query.cityName = { $regex: new RegExp(cityName.trim(), "i") };
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
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid banner ID"));
  }

  const banner = await Banner.findById(id);
  if (!banner) {
    return res.status(404).json(new ApiResponse(404, null, "Banner not found"));
  }

  banner.title = title?.trim() || banner.title;
  banner.description = description?.trim() || banner.description;
  banner.link = link?.trim() || banner.link;

  if (isActive !== undefined) {
    banner.isActive = isActive;
  }

  // Handle file upload and deletion
  if (req.file) {
    const s3Path = `banner/${Date.now()}_${req.file.originalname}`;
    try {
      const fileUrl = await s3Service.uploadFile(req.file, s3Path);
      const newImageUrl = fileUrl?.url;

      if (!newImageUrl) {
        throw new Error("Image upload failed");
      }
      if (banner.image) {
        try {
          await s3Service.deleteFile(banner.image);
        } catch (err) {
          console.error("Error deleting old image:", err.message);
        }
      }

      banner.image = newImageUrl;
    } catch (err) {
      console.error("Error uploading new image:", err.message);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Image upload failed"));
    }
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
  if (banner.image) {
    try {
      await s3Service.deleteFile(banner.image);
    } catch (err) {
      console.error("Error deleting old image:", err.message);
    }
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

  if (ids.some((id) => !isValidObjectId(id))) {
    throw new ApiError(400, "One or more invalid banner IDs");
  }

  const banners = await Banner.find({ _id: { $in: ids } });
  if (!banners || banners.length === 0) {
    throw new ApiError(404, "No banners found with the given IDs");
  }

  for (const banner of banners) {
    if (banner.image) {
      try {
        await s3Service.deleteFile(banner.image);
      } catch (err) {
        console.error(
          `Error deleting banner image (${banner.image}):`,
          err.message
        );
      }
    }
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

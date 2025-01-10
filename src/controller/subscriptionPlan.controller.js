import { SubscriptionPlan } from "../model/subscriptionPlan.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import s3ServiceWithProgress from "../config/awsS3.config.js";

const s3Service = new s3ServiceWithProgress();
/*----------------------------------Create a subscription plan---------------------------------*/
const createSubscriptionPlan = asyncHandler(async (req, res) => {
  const {
    name,
    title,
    description,
    price,
    maxProperties,
    isActive = false,
  } = req.body;

  if (!price) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Price object is required."));
  }

  if (
    price.Monthly === undefined ||
    price.Monthly === null ||
    price.Monthly < 0
  ) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Monthly price is required and must be 0 or greater."
        )
      );
  }

  if (price.Yearly === undefined || price.Yearly === null || price.Yearly < 0) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Yearly price is required and must be 0 or greater."
        )
      );
  }
  const existingPlan = await SubscriptionPlan.findOne({ name, title });
  if (existingPlan) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Plan with this name or title already exists!"
        )
      );
  }
  let icon = "";
  if (req.file) {
    const s3Path = `subscription-icon/${Date.now()}_${req.file.originalname}`;
    const fileUrl = await s3Service.uploadFile(req.file, s3Path);
    icon = fileUrl.url;
  }

  const newPlan = new SubscriptionPlan({
    name,
    title,
    description,
    price,
    maxProperties,
    icon,
    isActive,
  });
  if (!newPlan) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Failed to create subscription plan!"));
  }

  await newPlan.save();
  res
    .status(201)
    .json(
      new ApiResponse(201, newPlan, "Subscription Plan created successfully!")
    );
});
/*----------------------------------update a subscription plan---------------------------------*/

const updateSubscriptionPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, title, description, price, maxProperties, isActive } = req.body;

  if (!id) {
    throw new ApiError(400, "Subscription plan ID is required");
  }
  // Find the existing plan first
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) {
    throw new ApiError(404, "Subscription plan not found");
  }
  if (price.Monthly == null || price.Monthly < 0) {
    throw new ApiError(400, "Price object is required");
  }
  if (price.Yearly == null || price.Yearly < 0) {
    throw new ApiError(400, "Price object is required");
  }
  const existingPlan = await SubscriptionPlan.findOne({
    _id: { $ne: id },
    $or: [{ name }, { title }],
  });

  if (existingPlan) {
    throw new ApiError(400, "A plan with this name or title already exists");
  }

  let updateData = {
    name,
    title,
    description,
    price,
    maxProperties,
    isActive,
  };

  // Handle icon upload if file is present
  if (req.file) {
    try {
      const s3Path = `subscription-icon/${Date.now()}_${req.file.originalname}`;
      const fileUrl = await s3Service.uploadFile(req.file, s3Path);

      // Delete old icon if it exists
      if (plan.icon) {
        await s3Service.deleteFile(plan.icon);
      }
      updateData.icon = fileUrl.url;
    } catch (error) {
      throw new ApiError(500, "Error handling plan icon upload");
    }
  }

  // Update the plan
  const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlan,
        "Subscription plan updated successfully"
      )
    );
});

/*----------------------------------get a subscription plan by Id---------------------------------*/
const getSubscriptionPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const plan = await SubscriptionPlan.findById(id);

  if (!plan) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Subscription plan not found!"));
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, plan, "Subscription plan fetched successfully!")
    );
});
/*----------------------------------Delete a subscription plan---------------------------------*/
const getAllSubscriptionPlans = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isActive } = req.query;

  // Parse page and limit to integers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  // Build the filter object
  const filter = {};
  if (isActive === "true") {
    filter.isActive = true;
  } else if (isActive === "false") {
    filter.isActive = false;
  }

  // Count total plans based on filter
  const totalPlans = await SubscriptionPlan.countDocuments(filter);

  // Fetch paginated subscription plans
  const plans = await SubscriptionPlan.find(filter)
    .skip(skip)
    .limit(limitNumber)
    .sort({ "price.Monthly": 1 });

  // Return response with pagination info
  res.status(200).json(
    new ApiResponse(
      200,
      {
        result: plans,
        pagination: {
          totalPages: Math.ceil(totalPlans / limitNumber),
          currentPage: pageNumber,
          totalItems: totalPlans,
          itemsPerPage: limitNumber,
        },
      },
      "Subscription plans fetched successfully!"
    )
  );
});

/*----------------------------------Delete a subscription plan---------------------------------*/

const deleteSubscriptionPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedPlan = await SubscriptionPlan.findByIdAndDelete(id);

  if (!deletedPlan) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Subscription plan not found!"));
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, null, "Subscription plan deleted successfully!")
    );
});

export {
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getSubscriptionPlanById,
  getAllSubscriptionPlans,
  deleteSubscriptionPlan,
};

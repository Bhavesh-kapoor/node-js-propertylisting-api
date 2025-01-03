import { SubscriptionPlan } from "../model/subscriptionPlan.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
/*----------------------------------Create a subscription plan---------------------------------*/
const createSubscriptionPlan = asyncHandler(async (req, res) => {
  const { name, title, description, price, maxProperties } = req.body;

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

  if (
    price.Quarterly === undefined ||
    price.Quarterly === null ||
    price.Quarterly < 0
  ) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Quarterly price is required and must be 0 or greater."
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
  const newPlan = new SubscriptionPlan({
    name,
    title,
    description,
    price,
    maxProperties,
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
  if (!price || !price.Monthly || !price.Quarterly || !price.Yearly) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "All price fields (Monthly, Quarterly, Yearly) are required."
        )
      );
  }
  const existingPlan = await SubscriptionPlan.findOne({
    _id: { $ne: id },
    $or: [{ name }, { title }],
  });

  if (existingPlan) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "A similar plan with this name or title already exists!"
        )
      );
  }

  const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
    id,
    { name, title, description, price, maxProperties, isActive },
    { new: true }
  );

  if (!updatedPlan) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Subscription plan not found!"));
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlan,
        "Subscription plan updated successfully!"
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
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const totalPlans = await SubscriptionPlan.countDocuments(filter);

  const plans = await SubscriptionPlan.find(filter)
    .skip(skip)
    .limit(limitNumber)
    .sort({ "price.Monthly": 1 });

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

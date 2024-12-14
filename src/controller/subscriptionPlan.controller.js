import { SubscriptionPlan } from "../model/subscriptionPlan.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
/*----------------------------------Create a subscription plan---------------------------------*/
const createSubscriptionPlan = asyncHandler(async (req, res) => {
    const { name, description, price, maxProperties } = req.body;

    const existingPlan = await SubscriptionPlan.findOne({ name: name, description: description, price: price });
    if (existingPlan) {
        return res.status(200).json(new ApiResponse(200, null, "Plan with this specification already exists!"))
    }

    const newPlan = new SubscriptionPlan({
        name,
        description,
        price,
        maxProperties,
    });

    await newPlan.save();
    res.status(201).json(new ApiResponse(200, newPlan, " subscription Plan created successfully!"));
});
/*----------------------------------update a subscription plan---------------------------------*/
const updateSubscriptionPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, maxProperties, isActive } = req.body;

    const existingPlan = await SubscriptionPlan.findOne({
        _id: { $ne: id },
        name,
        description,
        price,
    });

    if (existingPlan) {
        return res
            .status(200)
            .json(new ApiResponse(200, null, "A similar plan already exists!"));
    }
/*----------------------------------Upadate a subscription plan---------------------------------*/
    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
        id,
        { name, description, price, maxProperties, isActive },
        { new: true }
    );

    if (!updatedPlan) {
        return res
            .status(404)
            .json(new ApiResponse(404, null, "Subscription plan not found!"));
    }

    res.status(200).json(
        new ApiResponse(200, updatedPlan, "Subscription plan updated successfully!")
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

    res.status(200).json(new ApiResponse(200, plan, "Subscription plan fetched successfully!"));
});
/*----------------------------------Delete a subscription plan---------------------------------*/
const getAllSubscriptionPlans = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, isActive } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }

    const totalPlans = await SubscriptionPlan.countDocuments(filter);

    const plans = await SubscriptionPlan.find(filter)
        .skip(skip)
        .limit(limitNumber)
        .sort({ price: 1 });

    res.status(200).json(
        new ApiResponse(200, { 
            result: plans,
            pagination: {
              totalPages: Math.ceil(totalPlans / limitNumber),
              currentPage: pageNumber,
              totalItems: totalPlans,
              itemsPerPage: limitNumber,
            },
          }, "Subscription plans fetched successfully!")
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

    res.status(200).json(
        new ApiResponse(200, null, "Subscription plan deleted successfully!")
    );
});

export { createSubscriptionPlan, updateSubscriptionPlan, getSubscriptionPlanById, getAllSubscriptionPlans, deleteSubscriptionPlan }

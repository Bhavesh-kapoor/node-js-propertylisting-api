import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { SubscribedPlan } from "../model/subscribedPlan.model.js";
import { SubscriptionPlan } from "../model/subscriptionPlan.model.js";
import { addDays } from "date-fns";

/*---------------------------------------------subscribe to an new plan------------------------------*/

const subscribeAPlan = asyncHandler(async (req, res) => {
    const { paymentDetails, transaction } = req;

    console.log("paymentDetails", paymentDetails)
    transaction.transactionDetails = paymentDetails;
    transaction.status = paymentDetails.status;
    transaction.paymentMethod = paymentDetails.method;
    console.log("transaction-----", transaction)
    transaction.save();

    if (paymentDetails.status !== "captured") {
        return res.status(402).json(new ApiResponse(402, paymentDetails, "Payment failed!"))
    }
    const subscriptionPlan = await SubscriptionPlan.findById(transaction.subscription);
    console.log("subscriptionPlan", subscriptionPlan)
    if (!subscriptionPlan) {
        throw new ApiError(404, "Subscription plan not found.");
    }
    let endDate;
    const currentDate = new Date();

    switch (transaction.duration) {
        case "Monthly":
            endDate = addDays(currentDate, 28);  // Add 28 days for monthly
            break;
        case "Quarterly":
            endDate = addDays(currentDate, 84);  // Add 84 days for quarterly
            break;
        case "Yearly":
            endDate = addDays(currentDate, 365);  // Add 365 days for yearly
            break;
        default:
            endDate = currentDate;
            break;
    }

    const newSubscribedPlan = await SubscribedPlan.create({
        user: req.user._id,
        plan: transaction.subscription,
        listingOffered: subscriptionPlan.maxProperties,
        transaction: transaction._id,
        endDate: endDate,
        startDate: startDate
    });

    res.status(201).json(new ApiResponse(201, newSubscribedPlan, "Subscription successful!"))
})

/*-----------------------------------------get all subscriptions----------------------------------*/

const getAllSubscribedPlans = asyncHandler(async (req, res) => {
    const subscribedPlans = await SubscribedPlan.find()
        .populate("userId", "name email")
        .populate("planId", "name title description")
        .populate("transactionId");

    if (!subscribedPlans?.length) {
        throw new ApiError(404, "No subscribed plans found");
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            subscribedPlans,
            "Subscribed plans retrieved successfully"
        ));
});

/*-----------------------------------------get subscription by id----------------------------------*/

const getSubscribedPlanById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Subscribed plan ID is required");
    }

    const subscribedPlan = await SubscribedPlan.findById(id)
        .populate("userId", "name email")
        .populate("planId", "name title description")
        .populate("transactionId");

    if (!subscribedPlan) {
        throw new ApiError(404, "Subscribed plan not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            subscribedPlan,
            "Subscribed plan retrieved successfully"
        ));
});

/*-----------------------------------------get subscriptions by user id----------------------------------*/
const getSubscribedPlansByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const subscribedPlans = await SubscribedPlan.find({ userId })
        .populate("userId", "name email")
        .populate("planId", "name title description")
        .populate("transactionId")
        .sort({ createdAt: -1 }); // Get latest subscriptions first

    if (!subscribedPlans?.length) {
        throw new ApiError(404, "No subscribed plans found for this user");
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            subscribedPlans,
            "User's subscribed plans retrieved successfully"
        ));
});

/*---------------------------------Get current active subscription for user--------------------------*/
const getCurrentSubscription = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const currentDate = new Date();
    const activeSubscription = await SubscribedPlan.findOne({
        userId,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
    })
        .populate("userId", "name email")
        .populate("planId", "name title description")
        .populate("transactionId");

    if (!activeSubscription) {
        throw new ApiError(404, "No active subscription found for this user");
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            activeSubscription,
            "Current active subscription retrieved successfully"
        ));
});

/*--------------------------------------------- Delete subscribed plan--------------------------------*/

const deleteSubscribedPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Subscribed plan ID is required");
    }

    const deletedPlan = await SubscribedPlan.findByIdAndDelete(id);

    if (!deletedPlan) {
        throw new ApiError(404, "Subscribed plan not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Subscribed plan deleted successfully"
        ));
});

export { subscribeAPlan, getAllSubscribedPlans, getSubscribedPlanById, getSubscribedPlansByUserId, getCurrentSubscription, deleteSubscribedPlan }
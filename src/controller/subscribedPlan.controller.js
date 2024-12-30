import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { SubscribedPlan } from "../model/subscribedPlan.model.js";
import { SubscriptionPlan } from "../model/subscriptionPlan.model.js";
import { User } from "../model/user.model.js";
import { addDays } from "date-fns";

/*---------------------------------------------subscribe to an new plan------------------------------*/

// const subscribeAPlan = asyncHandler(async (req, res) => {
//   const { paymentDetails, transaction } = req;
//   const user = req.user;
//   transaction.transactionDetails = paymentDetails;
//   transaction.status = paymentDetails.status;
//   transaction.paymentMethod = paymentDetails.method;
//   console.log("transaction-----", transaction);
//   const savedTransaction = transaction.save();

//   if (paymentDetails.status !== "captured") {
//     return res
//       .status(402)
//       .json(new ApiResponse(402, paymentDetails, "Payment failed!"));
//   }
//   const subscriptionPlan = await SubscriptionPlan.findById(
//     transaction.subscription
//   );
//   console.log("subscriptionPlan", subscriptionPlan);
//   if (!subscriptionPlan) {
//     throw new ApiError(404, "Subscription plan not found.");
//   }
//   let endDate;
//   const currentDate = new Date();
//   switch (transaction.duration) {
//     case "Monthly":
//       endDate = addDays(currentDate, 28); // Add 28 days for monthly
//       break;
//     case "Quarterly":
//       endDate = addDays(currentDate, 84); // Add 84 days for quarterly
//       break;
//     case "Yearly":
//       endDate = addDays(currentDate, 365); // Add 365 days for yearly
//       break;
//     default:
//       endDate = currentDate;
//       break;
//   }
//   const existingPlan = await SubscribedPlan.findOne({
//     userId: user._id,
//     startDate: { $lte: currentDate },
//     endDate: { $gte: currentDate },
//     isActive: true,
//   });
//   let listingOffered = subscriptionPlan.maxProperties;
//   if (existingPlan) {
//     listingOffered =
//       listingOffered + (existingPlan.listingOffered - existingPlan.listed);
//   }
//   existingPlan.isActive = false;
//   await existingPlan.save();

//   const newSubscribedPlan = await SubscribedPlan.create({
//     userId: user._id,
//     planId: transaction.subscription,
//     listingOffered: listingOffered,
//     transactionId: transaction._id,
//     endDate: endDate,
//   });
//   user.isVerified = true;
//   await user.save();
//   res.status(201).json(
//     new ApiResponse(
//       201,
//       {
//         subscriptionDetails: newSubscribedPlan,
//         transactionDetails: savedTransaction,
//       },
//       "Subscription successful!"
//     )
//   );
// });

const subscribeAPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const user = req.user;
  const subscriptionPlan = await SubscriptionPlan.findById(planId);
  if (!subscriptionPlan) {
    throw new ApiError(404, "Subscription plan not found.");
  }

  const alreadySubscribed = SubscribedPlan.findOne({
    userId: user._id,
    planId: planId,
    status: { $in: ["pending", "active"] },
  });
  console.log("alreadySubscribed",alreadySubscribed)
  if (alreadySubscribed) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "This plan is already subscribed"));
  }
  let endDate;
  const currentDate = new Date();
  switch (transaction.duration) {
    case "Monthly":
      endDate = addDays(currentDate, 28); // Add 28 days for monthly
      break;
    case "Quarterly":
      endDate = addDays(currentDate, 84); // Add 84 days for quarterly
      break;
    case "Yearly":
      endDate = addDays(currentDate, 365); // Add 365 days for yearly
      break;
    default:
      endDate = currentDate;
      break;
  }
  let listingOffered = subscriptionPlan.maxProperties;
  const newSubscribedPlan = await SubscribedPlan.create({
    userId: user._id,
    planId: planId,
    listingOffered: listingOffered,
    endDate: endDate,
  });
  res.status(201).json(
    new ApiResponse(
      201,
      {
        subscriptionDetails: newSubscribedPlan,
      },
      "Subscription successful!"
    )
  );
});
/*----------------------------------------make plan active--------------------------------*/
const makePlanActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Subscribed plan ID is required");
  }
  const subscribedPlan = await SubscribedPlan.findById(id);
  if (!subscribedPlan) {
    throw new ApiError(404, "Subscribed plan not found");
  }
  const user = await User.findById(subscribedPlan.userId);
  const currentDate = new Date();
  const existingPlan = await SubscribedPlan.findOne({
    userId: subscribedPlan.userId,
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
    isActive: true,
  });
  let listingOffered = subscribedPlan.listingOffered;
  if (existingPlan) {
    listingOffered =
      listingOffered + (existingPlan.listingOffered - existingPlan.listed);
  }
  subscribedPlan.listingOffered = listingOffered;
  subscribedPlan.isActive = true;
  subscribedPlan.status = "active";
  await subscribedPlan.save();
  existingPlan.isActive = false;
  await existingPlan.save();
  user.isVerified = true;
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedPlan,
        "Subscribed plan made active successfully"
      )
    );
});

/*-----------------------------------------get all subscriptions----------------------------*/

const getAllSubscribedPlans = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const subscribedPlans = await SubscribedPlan.find({ status: status })
    .populate("userId", "name email")
    .populate("planId", "name title description")
    .populate("transactionId");

  if (!subscribedPlans?.length) {
    throw new ApiError(404, "No subscribed plans found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedPlans,
        "Subscribed plans retrieved successfully"
      )
    );
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
    .json(
      new ApiResponse(
        200,
        subscribedPlan,
        "Subscribed plan retrieved successfully"
      )
    );
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
    return res.status(200).json(new ApiResponse(200,{},"No subscribed plans found for this user"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedPlans,
        "User's subscribed plans retrieved successfully"
      )
    );
});

/*---------------------------------Get current active subscription for user--------------------------*/
const getCurrentSubscription = asyncHandler(async (req, res) => {
  console.log(req.user);
  const user = req.user;
  let userId = user._id;
  if (user.role === "admin") {
    userId = req.params.userId;
  }

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const currentDate = new Date();
  const activeSubscription = await SubscribedPlan.findOne({
    userId,
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
    isActive: true,
  })
    .populate("userId", "name email")
    .populate("planId", "name title description")
    .populate("transactionId");

  if (!activeSubscription) {
    throw new ApiError(404, "No active subscription found for this user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        activeSubscription,
        "Current active subscription retrieved successfully"
      )
    );
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
    .json(new ApiResponse(200, {}, "Subscribed plan deleted successfully"));
});

export {
  subscribeAPlan,
  getAllSubscribedPlans,
  getSubscribedPlanById,
  getSubscribedPlansByUserId,
  getCurrentSubscription,
  deleteSubscribedPlan,
  makePlanActive,
};

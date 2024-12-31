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
  const { duration } = req.body;
  const user = req.user;

  const subscriptionPlan = await SubscriptionPlan.findById(planId);
  if (!subscriptionPlan) {
    throw new ApiError(404, "Subscription plan not found.");
  }
  const existingSubscription = await SubscribedPlan.findOne({
    userId: user._id,
    status: { $in: ["pending", "active"] },
  }).populate("planId");

  if (existingSubscription) {
    if (existingSubscription.status === "pending") {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            null,
            "You have a pending subscription. Please wait for it to be activated."
          )
        );
    }
    if (existingSubscription.status === "active") {
      const isExistingPlanFree =
        existingSubscription.planId.price.Monthly === 0;

      // If the existing active plan is free, only allow one pending plan
      if (isExistingPlanFree) {
        const pendingPlan = await SubscribedPlan.findOne({
          userId: user._id,
          status: "pending",
        });
        if (pendingPlan) {
          return res
            .status(400)
            .json(
              new ApiResponse(
                400,
                null,
                "You already have a free active plan and a pending subscription. Please wait for it to be activated."
              )
            );
        }
      } else {
        // If the existing plan is not free, disallow a new subscription
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              null,
              "You already have an active paid subscription plan."
            )
          );
      }
    }
  }

  // Calculate end date based on duration
  let endDate;
  const currentDate = new Date();
  switch (duration) {
    case "Monthly":
      endDate = addDays(currentDate, 28);
      break;
    case "Quarterly":
      endDate = addDays(currentDate, 84);
      break;
    case "Yearly":
      endDate = addDays(currentDate, 365);
      break;
    default:
      endDate = currentDate;
      break;
  }

  // Create new subscription
  const listingOffered = subscriptionPlan.maxProperties;
  const newSubscribedPlan = await SubscribedPlan.create({
    userId: user._id,
    planId: planId,
    listingOffered: listingOffered,
    endDate: endDate,
  });

  return res.status(201).json(
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
  const {
    status,
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const pipeline = [
    {
      $match: {
        ...(status && { status }),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "subscriptionplans",
        localField: "planId",
        foreignField: "_id",
        as: "plan",
      },
    },
    {
      $unwind: "$plan",
    },
    {
      $project: {
        _id: 1,
        status: 1,
        startDate: 1,
        endDate: 1,
        userName: "$user.name",
        userId: "$user.id",
        userEmail: "$user.email",
        planName: "$plan.name",
        planTitle: "$plan.title",
        planDescription: "$plan.description",
      },
    },
    {
      $sort: { [sort]: order === "desc" ? -1 : 1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: Number(limit),
    },
  ];

  // To calculate total count
  const totalCountPipeline = [
    {
      $match: {
        ...(status && { status }),
      },
    },
    {
      $count: "totalCount",
    },
  ];

  const [subscribedPlans, totalCountResult] = await Promise.all([
    SubscribedPlan.aggregate(pipeline),
    SubscribedPlan.aggregate(totalCountPipeline),
  ]);

  const totalCount = totalCountResult[0]?.totalCount || 0;

  const pagination = {
    currentPage: Number(page),
    totalPages: Math.ceil(totalCount / limit),
    totalItems: totalCount,
    itemsPerPage: Number(limit),
  };

  if (pagination.currentPage > pagination.totalPages && totalCount > 0) {
    throw new ApiError(404, "Page not found");
  }

  if (!subscribedPlans.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No subscribed plans found!"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { result: subscribedPlans, pagination },
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
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No subscribed plans found!"));
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
    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "No subscribed plans found for this user")
      );
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
    .populate("planId", "name title description");

  if (!activeSubscription) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "No subscribed plans found for this user")
      );
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

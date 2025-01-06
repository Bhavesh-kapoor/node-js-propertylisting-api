import ApiError from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { SubscribedPlan } from "../model/subscribedPlan.model.js";

import {
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  format,
  eachDayOfInterval,
} from "date-fns";
import { Transaction } from "../model/transaction.model.js";

// Function to generate a random RGB color
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, 0.5)`;
};

const getOverview = asyncHandler(async (req, res) => {
  const {
    dateRange = "today",
    status = "active",
    page = 1,
    limit = 5,
  } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skipDocs = (pageNumber - 1) * limitNumber;

  // Set up date ranges
  const now = new Date();
  let dateStart, dateEnd;

  switch (dateRange) {
    case "today":
      dateStart = new Date(now.setHours(0, 0, 0, 0));
      dateEnd = endOfDay(now);
      break;
    case "month":
      dateStart = new Date(now.setDate(1));
      dateEnd = endOfMonth(now);
      break;
    default:
      dateStart = new Date(now.setHours(0, 0, 0, 0));
      dateEnd = endOfDay(now);
  }

  // Fetch active users (non-admin)
  const users = await User.find({ isActive: true, role: { $ne: "admin" } })
    .sort({ createdAt: -1 })
    .skip(skipDocs)
    .limit(limitNumber)
    .select("name avatarUrl email mobile role")
    .lean();

  // Count total users for pagination
  const totalUsers = await User.countDocuments({
    isActive: true,
    role: { $ne: "admin" },
  });

  // Aggregate pipeline for subscribed plans
  const pipeline = [
    {
      $match: {
        status: status,
        createdAt: { $gte: dateStart, $lte: dateEnd },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userData",
      },
    },
    {
      $unwind: {
        path: "$userData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "subscriptionplans",
        localField: "planId",
        foreignField: "_id",
        as: "subscriptionPlan",
      },
    },
    {
      $unwind: {
        path: "$subscriptionPlan",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        amount: 1,
        status: 1,
        duration: 1,
        startDate: 1,
        endDate: 1,
        listingOffered: 1,
        listed: 1,
        createdAt: 1,
        user: {
          _id: "$userData._id",
          name: "$userData.name",
          email: "$userData.email",
        },
        plan: {
          _id: "$subscriptionPlan._id",
          name: "$subscriptionPlan.name",
          description: "$subscriptionPlan.description",
        },
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skipDocs },
    { $limit: limitNumber },
  ];

  // Get total count for pagination
  const countPipeline = [...pipeline];
  countPipeline.splice(-2); // Remove skip and limit stages
  const [{ count: totalTransactions } = { count: 0 }] =
    await SubscribedPlan.aggregate([...countPipeline, { $count: "count" }]);

  const transactions = await SubscribedPlan.aggregate(pipeline);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        subscribedPlans: transactions,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalTransactions / limitNumber),
          totalUsers,
          totalTransactions,
          limit: limitNumber,
        },
      },
      "Data fetched successfully!"
    )
  );
});

const getOverviewByRevenue = asyncHandler(async (req, res) => {
  // Get the current date and the start of the month for filtering
  const currentDate = new Date();
  const startOfCurrentMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  const data = await SubscribedPlan.aggregate([
    {
      $match: {
        status: { $in: ["active", "expired"] },
        startDate: {
          $gte: new Date(currentDate.getFullYear(), 0, 1),
          $lte: new Date(currentDate.getFullYear(), 11, 31),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$startDate" } },
        monthlyRevenue: { $sum: `$amount` },
      },
    },
    {
      $project: {
        month: "$_id.month",
        monthlyRevenue: 1,
        _id: 0,
      },
    },
    { $sort: { month: 1 } },
  ]);

  const currentMonthData = await SubscribedPlan.aggregate([
    {
      $match: {
        status: { $in: ["active", "expired"] },
        startDate: { $gte: startOfCurrentMonth, $lte: currentDate }, // Filter for the current month
      },
    },
    {
      $group: {
        _id: null, // No grouping needed
        currentMonthRevenue: { $sum: `$amount` }, // Sum current month revenue
      },
    },
  ]);

  const totalRevenue = data.reduce(
    (sum, entry) => sum + entry.monthlyRevenue,
    0
  );
  const currentMonthRevenue = currentMonthData[0]?.currentMonthRevenue || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalRevenue,
        currentMonthRevenue,
        monthlyData: data,
      },
      "Revenue data fetched successfully!"
    )
  );
});

const getTransactionsByMonth = asyncHandler(async (req, res) => {
  try {
    const { year, month } = req.query;
    // If no year is provided, default to the current year
    const selectedYear = year ? parseInt(year, 10) : new Date().getFullYear();
    let start, end, interval;
    if (month) {
      if (month) {
        const parsedMonth = parseInt(month, 10);
        if (parsedMonth < 1 || parsedMonth > 12) {
          return res
            .status(200)
            .json(new ApiResponse(200, null, "invalid month"));
        }
      }
      const selectedMonth = parseInt(month, 10) - 1;
      start = startOfMonth(new Date(selectedYear, selectedMonth));
      end = endOfMonth(new Date(selectedYear, selectedMonth));
      interval = eachDayOfInterval({ start, end });
    } else {
      start = startOfYear(new Date(selectedYear, 0));
      end = endOfYear(new Date(selectedYear, 11));
      interval = eachMonthOfInterval({ start, end });
    }
    const transactions = await SubscribedPlan.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
          status: "active",
        },
      },
      {
        $group: {
          _id: month ? { $dayOfMonth: "$createdAt" } : { $month: "$createdAt" },
          totalRevenue: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Initialize response with zero data for each day/month
    const response = interval.map((date) => ({
      label: month ? format(date, "dd MMMM") : format(date, "MMMM"),
      totalRevenue: 0,
    }));

    // Populate response based on transactions data
    transactions.forEach((transaction) => {
      const index = month ? transaction._id - 1 : transaction._id - 1; // zero-indexed
      response[index].totalRevenue = transaction.totalRevenue;
    });

    // Format the final response for charting
    const finalResponse = {
      datasets: [
        {
          label: "Revenue",
          data: response.map((item) => item.totalRevenue),
          borderColor: "rgb(54, 162, 235)",
          tension: 0.3,
          fill: true,
        },
      ],
    };

    res
      .status(200)
      .json(new ApiResponse(200, finalResponse, "Data fetched successfully"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, "Server error", error));
  }
});

export { getOverview, getTransactionsByMonth, getOverviewByRevenue };

import ApiError from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

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
  const user = req.user;
  const {
    dateRange = "today",
    status = "captured",
    page = 1,
    limit = 5,
  } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  // Set up date ranges based on the dateRange query parameter
  const now = new Date();
  let dateStart, dateEnd;

  if (dateRange === "today") {
    dateStart = now;
    dateEnd = endOfDay(now);
  } else {
    dateStart = now;
    dateEnd = endOfMonth(now);
  }
  const users = await User.find({ role: "dealer" })
    .sort({ createdAt: -1 })
    .limit(limitNumber)
    .select("name avatarUrl email mobile role");

  const pipeline = [
    { $match: { status: status } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        amount: 1,
        createdAt: 1,
        transactionId: 1,
        userName: "$userData.name",
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: limitNumber },
  ];
  const transactions = await Transaction.aggregate(pipeline).exec();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        transactions,
      },
      "Data fetched successfully!"
    )
  );
});

const getOverviewByRevenue = asyncHandler(async (req, res) => {
  try {
    const { currency = "amount" } = req.query;

    // Get the current date and the start of the month for filtering
    const currentDate = new Date();
    const startOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const data = await Transaction.aggregate([
      {
        $match: {
          status: "captured",
          createdAt: {
            $gte: startOfYear(new Date()), // From the start of the year
            $lte: endOfYear(new Date()), // To the end of the year
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } }, // Group by the month of `createdAt`
          monthlyRevenue: { $sum: `$${currency}` }, // Sum monthly revenue
        },
      },
      {
        $project: {
          month: "$_id.month", // Move the `month` field outside `_id`
          monthlyRevenue: 1,
          _id: 0, // Remove the `_id` field
        },
      },
      { $sort: { month: 1 } }, // Sort by month
    ]);

    const currentMonthData = await Transaction.aggregate([
      {
        $match: {
          status: "captured",
          createdAt: { $gte: startOfCurrentMonth, $lte: currentDate }, // Filter for the current month
        },
      },
      {
        $group: {
          _id: null, // No grouping needed
          currentMonthRevenue: { $sum: `$${currency}` }, // Sum current month revenue
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
  } catch (error) {
    console.error("Error fetching revenue overview by category:", error);
    throw new ApiError(500, error.message);
  }
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
    const transactions = await Transaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
          status: "captured",
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

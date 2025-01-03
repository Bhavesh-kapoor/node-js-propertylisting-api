import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isValidObjectId, paginationResult } from "../utils/helper.js";
import { Transaction } from "../model/transaction.model.js";
import { generateTransactionId } from "../utils/helper.js";

/*----------------------------------------------create transaction------------------------------------------*/

// const createTransaction = asyncHandler(async (req, res) => {
//     const { userId, transactionId, subscriptionPlanId, amount, paymentMethod, status,duration } = req.body;

//     const existingTransaction = await Transaction.findOne({ transactionId });
//     if (existingTransaction) {
//         return res.status(400).json(new ApiResponse(400, null, "Transaction with this ID already exists!"));
//     }

//     const transaction = new Transaction({
//         userId,
//         transactionId,
//         subscriptionPlanId,
//         amount,
//         paymentMethod,
//         status,
//         duration
//     });

//     await transaction.save();
//     res.status(201).json(new ApiResponse(201, transaction, "Transaction created successfully!"));
// });

/*----------------------------------------------get all transactions------------------------------------------*/

const getTransactions = asyncHandler(async (req, res) => {
  const { userId, status, page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const filter = {};
  if (userId) filter.userId = userId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const transactions = await Transaction.find(filter)
    .populate("userId")
    .populate("subscription")
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const totalCount = await Transaction.countDocuments(filter);

  const response = paginationResult(
    pageNumber,
    limitNumber,
    totalCount,
    transactions
  );

  res
    .status(200)
    .json(new ApiResponse(200, response, "Transactions fetched successfully!"));
});

/*----------------------------------------------get transaction by id------------------------------------------*/

const getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await Transaction.findById(id)
    .populate("userId")
    .populate("subscriptionPlanId");
  if (!transaction) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Transaction not found!"));
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, transaction, "Transaction fetched successfully!")
    );
});

/*----------------------------------------------update transaction------------------------------------------*/

const updateTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { status } = req.body;

  if (!isValidObjectId(transactionId)) {
    throw new ApiError(400, "Invalid transaction ID");
  }

  // Update transaction and return the updated document
  const updatedTransaction = await Transaction.findByIdAndUpdate(
    transactionId,
    { $set: status },
    { new: true, runValidators: true }
  );

  if (!updatedTransaction) {
    throw new ApiError(404, "Transaction not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedTransaction,
        "Transaction updated successfully"
      )
    );
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await Transaction.findById(id);
  if (!transaction) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Transaction not found!"));
  }

  await transaction.remove();
  res
    .status(200)
    .json(new ApiResponse(200, null, "Transaction deleted successfully!"));
});
/*-------------------------------------------thank You-------------------------------------------*/

const thankyou = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id } = req.body;

  const transaction = await Transaction.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [
              { transactionId: razorpay_order_id },
              { transactionId: razorpay_payment_id },
            ],
          },
          { status: "captured" },
        ],
      },
    },
    {
      $project: {
        transactionId: 1,
        createdAt: 1,
        start_time: 1,
        status: 1,
      },
    },
  ]);

  if (transaction.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No transactions found for this user"));
  }

  return res.status(200).json(
    new ApiResponse(200, transaction, "Transactions retrieved successfully.")
  );
});

export {
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  thankyou
};

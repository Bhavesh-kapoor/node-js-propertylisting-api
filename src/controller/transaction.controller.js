import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Transaction } from "../model/transaction.model.js";
import { StoragePackage } from "../model/storagePackage.model.js";
import { isValidObjectId } from "../utils/helper.js";
import { generateTransactionId } from "../utils/helper.js";

/*----------------------------------------------create transaction------------------------------------------*/

const createTransaction = asyncHandler(async (req, res) => {
    const { packageId, paymentMethod } = req.body;
    const userId = req.user._id;
    const transactionExists = await Transaction.findOne({ userId, packageId });
    if (transactionExists) {
        throw new ApiError(409, "Transaction with this ID already exists");
    }
    if (!isValidObjectId(packageId)) {
        throw new ApiError(400, "Invalid package ID");
    }
    const storagepPackage = await StoragePackage.findById(packageId);
    if (!storagepPackage) {
        throw new ApiError(404, "Storage package not found");
    }
    const transactionStr = generateTransactionId()
    const newTransaction = new Transaction({
        userId,
        packageId,
        amount: storagepPackage.price,
        paymentMethod,
        transactionId: transactionStr
    });
    await newTransaction.save();
    res.status(201).json(new ApiResponse(201, newTransaction, "Transaction created successfully"));
});

/*----------------------------------------------get all transactions------------------------------------------*/

const getAllTransactions = asyncHandler(async (req, res) => {
    try {
        const transactions = await Transaction.find();

        res.status(200).json(new ApiResponse(200, transactions, "All transactions fetched successfully!"));
    } catch (error) {
        console.error("Error fetching transactions:", error.message);
        res.status(500).json(new ApiError(500, null, "Internal server error"));
    }
});

/*----------------------------------------------get transaction by id------------------------------------------*/

const getTransactionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json(new ApiError(404, null, "Transaction not found!"));
        }

        res.status(200).json(new ApiResponse(200, transaction, "Transaction fetched successfully!"));
    } catch (error) {
        console.error("Error fetching transaction by id:", error.message);
        res.status(500).json(new ApiError(500, null, "Internal server error"));
    }
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
        .json(new ApiResponse(200, updatedTransaction, "Transaction updated successfully"));
});

export { createTransaction, getAllTransactions, getTransactionById, updateTransaction }

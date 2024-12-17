import mongoose, { Schema, model } from "mongoose";

const TransactionSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        transactionId: {
            type: String,
            unique: true,
            required: true,
        },
        subscription: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubscriptionPlan",
            required: false,
        },
        duration:{
            type: String,
            enum:["Monthly","Quarterly","Yearly"]
        },
        curruncy: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String,
            // enum: ["credit_card", "debit_card", "upi", "net_banking", "wallet", "other"],
        },
        status: {
            type: String,
            // enum: ["success", "pending", "failed", "initiated"],
            default: "initiated",
        },
        transactionDetails: {
            type: Object,
            required: false,
            default: {}
        }

    },
    { timestamps: true }
);

export const Transaction = model("Transaction", TransactionSchema);

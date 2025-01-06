import mongoose from "mongoose";

const SubscribedPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // transactionId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Transaction",
    // },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    listingOffered: {
      type: Number,
      default: 0,
    },
    listed: {
      type: Number,
      default: 0,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive","expired"],
      default: "pending",
    },
    duration:{
      type: String,
      enum: ["Monthly","Yearly","Free"],
      trim: true,
    },
    amount:{
      type: Number,
    }
  },
  { timestamps: true }
);

export const SubscribedPlan = mongoose.model(
  "SubscribedPlan",
  SubscribedPlanSchema
);

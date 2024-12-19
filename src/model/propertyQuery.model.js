import mongoose from "mongoose";

const propertyQuerySchema = new mongoose.Schema(
  {
    senderName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    senderEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    senderMobile: {
      type: String,
      required: true,
      trim: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["resolved", "pending", "rejected"],
      default: "pending",
      lowercase: true,
      trim: true,
    },
    propertyOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
  },
  {
    timestamps: true,
    minimize: false,
    versionKey: false,
  }
);

export const PropertyQuery = mongoose.model(
  "PropertyQuery",
  propertyQuerySchema
);

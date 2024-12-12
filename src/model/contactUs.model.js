import mongoose from "mongoose";

const ContactUsSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
    minimize: false,
    versionKey: false,
  }
);

export const ContactUS = mongoose.model("ContactUS", ContactUsSchema);

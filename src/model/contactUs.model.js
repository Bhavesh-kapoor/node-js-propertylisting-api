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
    countryCode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\+\d{1,4}$/.test(v);
        },
        message: props => `${props.value} is not a valid country code! Use format like +1, +91, etc.`,
      },
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
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

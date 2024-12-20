import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["property", "listing", "home"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      // required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Banner = mongoose.model("Banner", BannerSchema);

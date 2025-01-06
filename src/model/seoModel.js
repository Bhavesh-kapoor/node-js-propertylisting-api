import mongoose from "mongoose";
import slugify from "slugify";

const SeoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
    },
    keyword: {
      type: String,
      required: true,
    },
    descriptions: {
      type: String,
      required: true,
    },
    noIndex: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

export const Seo = mongoose.model("Seo", SeoSchema);

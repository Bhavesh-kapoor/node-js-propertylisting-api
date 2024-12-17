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

SeoSchema.pre("save", function (next) {
  if (this.isNew) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});
export const Seo = mongoose.model("Seo", SeoSchema);

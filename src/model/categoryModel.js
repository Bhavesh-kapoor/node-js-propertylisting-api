import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 50,
      minlength: 2,
    },
    type: {
      type: String,
      required: true,
      default: "general",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CategorySchema.index({ name: 1, type: 1 }, { unique: true });

const Category = mongoose.model("Category", CategorySchema);

export default Category;

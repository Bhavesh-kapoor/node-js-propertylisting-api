import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      required: true,
    },
    state: {
      type: String,
      trim: true,
      required: true,
    },
    country: {
      type: String,
      trim: true,
      required: true,
      default: "India",
    },
    pinCode: {
      type: String,
      trim: true,
      required: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
      match: /^\d{10}$/,
    },
    countryCode: {
      type: String,
      trim: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: { type: String },
    role: {
      type: String,
      enum: ["admin", "dealer", "agent", "builder", "owner"],
      required: true,
    },
    permissions: { type: [String], default: [] },
    address: addressSchema,
    password: {
      type: String,
      minlength: 8,
    },
    isActive: { type: Boolean, default: false },
    isVerified: {
      type: Boolean,
      default: false,
    },
    priorityRank: {
      type: Number,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (!this.password) {
    const existingUser = await User.findById(this._id).select("password");
    if (existingUser) {
      this.password = existingUser.password;
    }
  } else {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Custom Instance Methods
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ userId: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ userId: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

const User = mongoose.model("User", userSchema);
export { User };

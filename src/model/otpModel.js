import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['mobile', 'email', 'hybrid'],
      required: true
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    mobile: {
      type: String,
      unique: true,
      sparse: true,
    },
    otp: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });
export const OTP = mongoose.model("OTP", otpSchema);

import { OTP } from "../model/otpModel.js";
import { generateOTP } from "./helper.js";

const createAndStoreOtp = async (identifier, type) => {
  try {
    if (!["mobile", "email", "hybrid"].includes(type)) {
      throw new Error("Invalid OTP type. Use 'mobile', 'email', or 'hybrid'.");
    }

    // Generate OTP
    const otpCode = generateOTP()
    const otpData = { otp: otpCode, type };

    if (type === "mobile") otpData.mobile = identifier;
    else if (type === "email") otpData.email = identifier;

    const existingOtp =
      type === "mobile"
        ? await OTP.findOne({ mobile: identifier })
        : await OTP.findOne({ email: identifier });

    if (existingOtp) {
      existingOtp.otp = otpCode;
      await existingOtp.save();
      console.log(`OTP resent for ${type}: ${otpCode}`);
    } else {
      const newOtp = new OTP(otpData);
      await newOtp.save();
      console.log(`OTP saved successfully for ${type}: ${otpCode}`);
    }

    return otpCode;
  } catch (error) {
    console.error(`Error in createAndStoreOtp: ${error.message}`);
    throw new Error("Failed to create or store OTP. Please try again.");
  }
};

const verifyOTP = async (identifier, otp) => {
  try {
    const otpDoc = await OTP.findOne({
      $or: [
        { mobile: identifier, otp },
        { email: identifier, otp },
      ],
    });

    if (otpDoc) {
      await OTP.deleteOne({ _id: otpDoc._id });
      console.log("OTP verified and deleted successfully.");
      return true;
    }
    console.log("Invalid OTP or identifier.");
    return false;
  } catch (error) {
    console.error(`Error in verifyOTP: ${error.message}`);
    throw new Error("Failed to verify OTP. Please try again.");
  }
};

export { createAndStoreOtp, verifyOTP };

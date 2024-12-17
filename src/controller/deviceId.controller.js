import { Device } from "../model/deviceId.model.js";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

/*---------------------------- Create a new device-----------------------------------*/
const createOrUpdateDevice = asyncHandler(async (req, res) => {
  const { deviceId, platform, deviceType, screenResolution } = req.body;
  const generatedDeviceId = deviceId || new mongoose.Types.ObjectId().toHexString();
  if (!generatedDeviceId) {
    return res
      .status(400)
      .json(ApiResponse(400, null, "Device ID is required!"));
  }

  const device = await Device.findOneAndUpdate(
    { deviceId },
    {
      $set: {
        deviceId:generatedDeviceId,
        platform,
        deviceType,
        screenResolution,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true } 
  );
  return res
    .status(200)
    .json(new ApiResponse(200, device, "Device created/updated successfully!"));
});

// Add a property to favorites
export const addFavoriteProperty =asyncHandler( async (req, res) => {
  const {deviceId, propertyId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, message: "Invalid property ID" });
    }

    const updatedDevice = await Device.findOneAndUpdate(
      { deviceId },
      { $addToSet: { favorites: propertyId } },
      { new: true }
    );
    if (!updatedDevice) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }
    return res
      .status(200)
      .json({ success: true, data: updatedDevice, message: "Property added to favorites" });
  }
)

// Remove a property from favorites
export const removeFavoriteProperty = async (req, res) => {
  const { deviceId, propertyId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, message: "Invalid property ID" });
    }

    const updatedDevice = await Device.findOneAndUpdate(
      { deviceId },
      { $pull: { favorites: propertyId } }, // Remove property from favorites
      { new: true }
    );

    if (!updatedDevice) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    return res
      .status(200)
      .json({ success: true, data: updatedDevice, message: "Property removed from favorites" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Clear all favorite properties
export const clearFavoriteProperties = async (req, res) => {
  const { deviceId } = req.params;

  try {
    const updatedDevice = await Device.findOneAndUpdate(
      { deviceId },
      { $set: { favorites: [] } }, // Clear all favorites
      { new: true }
    );

    if (!updatedDevice) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    return res
      .status(200)
      .json({ success: true, data: updatedDevice, message: "All favorites cleared" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get favorite properties (populated)
export const getFavoriteProperties = async (req, res) => {
  const { deviceId } = req.params;

  try {
    const device = await Device.findOne({ deviceId }).populate("favorites");

    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    return res.status(200).json({
      success: true,
      data: device.favorites,
      message: "Favorite properties retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { createOrUpdateDevice }
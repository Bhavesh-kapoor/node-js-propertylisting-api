import { Device } from "../model/deviceId.model.js";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { isValidObjectId } from "../utils/helper.js";

/*---------------------------- Create a new device-----------------------------------*/
const createOrUpdateDevice = asyncHandler(async (req, res) => {
  const { deviceId, platform, deviceType, screenResolution } = req.body;
  const generatedDeviceId =
    deviceId || new mongoose.Types.ObjectId().toHexString();
  if (!generatedDeviceId) {
    return res
      .status(400)
      .json(ApiResponse(400, null, "Device ID is required!"));
  }

  const device = await Device.findOneAndUpdate(
    { deviceId },
    {
      $set: {
        deviceId: generatedDeviceId,
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

/*---------------------------- Add a property to favorites-------------------------------*/

const addFavoriteProperty = asyncHandler(async (req, res) => {
  const { deviceId, propertyId } = req.body;

  if (!isValidObjectId(propertyId)) {
    throw new ApiError(400, "Invalid property ID");
  }

  const updatedDevice = await Device.findOneAndUpdate(
    { deviceId },
    { $addToSet: { favorites: propertyId } },
    { new: true }
  );
  if (!updatedDevice) {
    throw new ApiError(404, "Device not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedDevice, "Property added to favorites"));
});

/*----------------------------- Remove a property from favorites------------------------------*/

const removeFavoriteProperty = asyncHandler(async (req, res) => {
  const { deviceId, propertyId } = req.body;
  console.log();
  if (!isValidObjectId(propertyId)) {
    throw new ApiError(400, "Invalid property ID");
  }

  const updatedDevice = await Device.findOneAndUpdate(
    { deviceId },
    { $pull: { favorites: propertyId } }, // Remove property from favorites
    { new: true }
  );

  if (!updatedDevice) {
    throw new ApiError(404, "Device not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedDevice, "Property added to favorites"));
});

/*-----------------------------------Clear all favorite properties------------------------------*/
const clearFavoriteProperties = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  if (!isValidObjectId(propertyId)) {
    throw new ApiError(400, "Invalid property ID");
  }
  const updatedDevice = await Device.findOneAndUpdate(
    { deviceId },
    { $set: { favorites: [] } }, // Clear all favorites
    { new: true }
  );

  if (!updatedDevice) {
    throw new ApiError(404, "Device not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedDevice, "Property added to favorites"));
});

/*------------------------------ Get favorite properties (populated)------------------------------*/
const getFavoriteProperties = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;

  if (!deviceId) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Device ID is required or invalid!"));
  }
  const device = await Device.findOne({ deviceId }).populate("favorites");

  if (!device) {
    return res.status(200).json(new ApiResponse(200, [], "Device not found!"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        device.favorites,
        "Favorite properties retrieved successfully"
      )
    );
});

export {
  createOrUpdateDevice,
  addFavoriteProperty,
  removeFavoriteProperty,
  getFavoriteProperties,
  clearFavoriteProperties,
};

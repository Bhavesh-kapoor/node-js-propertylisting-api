import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: [true, "Device ID is required"],
            unique: true,
            sparse:true,
            trim: true,
        },
        platform: {
            type: String,
            required: [true, "Platform is required"],
            trim: true,
        },
        deviceType: {
            type: String,
            required: [true, "Device Type is required"],
            trim: true,
        },
        screenResolution: {
            type: String,
            required: [true, "Screen resolution is required"],
            trim: true,
        },
        favorites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Property",
                required: false,
            },
        ],
    },
    { timestamps: true }
)
export const Device = mongoose.model("Device", deviceSchema);

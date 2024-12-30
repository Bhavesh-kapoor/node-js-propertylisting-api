import { User } from "../model/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createAccessOrRefreshToken } from "../utils/helper.js";
import { check, validationResult } from "express-validator";
import { verifyOTP } from "../utils/otp.js";
import s3ServiceWithProgress from "../config/awsS3.config.js";
import { getPipeline, paginationResult } from "../utils/helper.js";
import { SubscriptionPlan } from "../model/subscriptionPlan.model.js";
import { SubscribedPlan } from "../model/subscribedPlan.model.js";
import { addDays } from "date-fns";

const s3Service = new s3ServiceWithProgress();

const userValidations = [
  check("name").notEmpty().withMessage("Name is required!"),
  check("mobile")
    .notEmpty()
    .withMessage("Mobile is required!")
    .isMobilePhone("any")
    .withMessage("Mobile format is invalid."),
  check("isMobileVerified")
    .notEmpty()
    .withMessage("isMobileVerified is required!")
    .isBoolean()
    .withMessage("isMobileVerified should be a boolean value (true or false)."),
];
const registerUser = asyncHandler(async (req, res) => {
  // Validate incoming request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(new ApiError(400, "Validation Error", errors.array()));
  }

  const {
    name,
    email,
    mobile,
    countryCode,
    role,
    isEmailVerified,
    isMobileVerified,
    password,
    permissions,
  } = req.body;

  const query = { $or: [{ email }] };
  if (mobile) query.$or.push({ mobile });

  const existedUser = await User.findOne(query);
  if (existedUser) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "User already exists!"));
  }

  // Handle file upload (avatar)
  let avatarUrl;
  if (req.file) {
    console.log(req.file)
    const s3Path = `avatars/${Date.now()}_${req.file.originalname}`;
    const fileUrl = await s3Service.uploadFile(req.file, s3Path);
    avatarUrl = fileUrl.url;
  }

  // Create the new user
  const user = await User.create({
    name,
    email,
    mobile,
    role,
    avatarUrl,
    countryCode,
    isEmailVerified,
    isMobileVerified,
    isActive: true,
    password: password || null,
    permissions,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  let newSubscribedPlan;
  if (createdUser.role === "dealer") {
    const freePlan = await SubscriptionPlan.findOne({
      $or: [
        { "price.Monthly": 0 },
        { "price.Quarterly": 0 },
        { "price.Yearly": 0 },
      ],
    });
    const currentDate = new Date();
    const endDate = addDays(currentDate, 3650);
    newSubscribedPlan = await SubscribedPlan.create({
      userId: createdUser._id,
      planId: freePlan._id,
      listingOffered: freePlan.maxProperties,
      transactionId: null,
      endDate: endDate,
    });
  }
  const { accessToken, refreshToken } = await createAccessOrRefreshToken(
    user._id
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        201,
        {
          createdUser,
          newSubscribedPlan,
          accessToken,
          refreshToken,
        },
        "User registered successfully"
      )
    );
});

export const getAdminDetails = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = await User.findOne(
      { _id: id, role: "admin" },
      {
        _id: 1,
        role: 1,
        name: 1,
        email: 1,
        mobile: 1,
        isActive: 1,
        password: 1,
        avatarUrl: 1,
        permissions: 1,
      }
    );

    if (!adminUser) {
      return res
        .status(404)
        .json({ success: false, message: "Admin user not found" });
    }

    res.status(200).json({ success: true, data: adminUser });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export const updateAdminDetails = asyncHandler(async (req, res) => {
  try {
    let profileImagePath;
    const { id } = req.params;
    const updates = req.body;

    if (req.file?.path) profileImagePath = req.file.path;

    const adminUser = await User.findOne({ _id: id });

    if (!adminUser) {
      return res
        .status(404)
        .json({ success: false, message: "Admin user not found" });
    }

    Object.assign(adminUser, {
      ...updates,
      password: req.body.password ? req.body.password : adminUser.password,
      avatarUrl: profileImagePath ? profileImagePath : adminUser.profileImage,
    });

    await adminUser.save();
    return res.status(200).json({ success: true, data: adminUser });
  } catch (error) {
    console.error("Error updating admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const document = await User.findByIdAndDelete(_id);
  if (!document) {
    return res.status(404).json(new ApiError(404, "", "invalid Docs!"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "", "Blog category deleted successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    throw new ApiError(
      400,
      "Identifier (email or mobile) and password are required"
    );
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { mobile: identifier }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await createAccessOrRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const loginAdmin = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    throw new ApiError(
      400,
      "Identifier (email or mobile) and password are required"
    );
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { mobile: identifier }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  if (user.role !== "admin") {
    throw new ApiError(403, "UnAuthorized!");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await createAccessOrRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Admin logged in successfully"
      )
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { name, email, isEmailVerified, address, isActive } = req.body;

  // Email verification requirement check
  if (email && !isEmailVerified) {
    throw new ApiError(
      400,
      "Email verification is required to update email address"
    );
  }

  // Prepare update fields
  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;
  if (isActive) updateFields.isActive = isActive;

  if (isEmailVerified !== undefined)
    updateFields.isEmailVerified = isEmailVerified;

  // Address handling
  if (address) {
    // Destructure provided address fields
    const { street, city, state, country, pincode, landmark } = address;

    // Check if address exists, update it; otherwise, set new address
    updateFields.address = {
      ...(req.user.address || {}),
      ...(street && { street }),
      ...(city && { city }),
      ...(state && { state }),
      ...(country && { country }),
      ...(pincode && { pincode }),
      ...(landmark && { landmark }),
    };
  }

  // Update the user document
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_KEY
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await createAccessOrRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new password are required");
  }
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const fetchUser = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 10 } = req.query;
  const { pipeline, matchStage, options } = getPipeline(req.query);

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  if (role) {
    if (!["admin", "dealer", "user"].includes(role)) {
      throw new ApiError(400, "role is invalid!");
    }
  }

  pipeline.push({
    $project: {
      _id: 1,
      email: 1,
      role: 1,
      mobile: 1,
      createdAt: 1,
      name: 1,
      avatarUrl: 1,
      isActive: 1,
    },
  });

  const users = await User.aggregate(pipeline, options);
  const totalUsers = await User.countDocuments(
    Object.keys(matchStage).length > 0 ? matchStage : {}
  );
  if (!users.length) {
    return res.status(404).json(new ApiError(404, null, "No user found!"));
  }

  const response = paginationResult(pageNumber, limitNumber, totalUsers, users);
  return res
    .status(200)
    .json(new ApiResponse(200, response, "User Fetch Successfully"));
});

const loginWithMobile = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile) {
    throw new ApiError(400, "Mobile number is required");
  }
  let existingUser = await User.findOne({ mobile });
  const isVerified = await verifyOTP(mobile, otp);
  if (!isVerified) {
    throw new ApiError(400, "Invalid OTP");
  }
  const { accessToken, refreshToken } = await createAccessOrRefreshToken(
    existingUser._id
  );
  const loggedInUser = await User.findById(existingUser._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const changeAvatarImage = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!req.file) {
    throw new ApiError(400, "Avatar image is required");
  }

  let avatarUrl;
  const s3Path = `avatars/${Date.now()}_${req.file.originalname}`;
  const fileUrl = await s3Service.uploadFile(req.file, s3Path);
  avatarUrl = fileUrl.url;

  // Delete the previous avatar if it exists
  if (user.avatarUrl) {
    try {
      await s3Service.deleteFile(user.avatarUrl);
    } catch (err) {
      console.error("Error deleting old avatar:", err.message);
      throw new ApiError(500, "Error deleting old avatar image");
    }
  }
  user.avatarUrl = avatarUrl;
  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

export {
  registerUser,
  loginUser,
  getCurrentUser,
  loginWithMobile,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  fetchUser,
  userValidations,
  updateAccountDetails,
  loginAdmin,
  changeAvatarImage,
};

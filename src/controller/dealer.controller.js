import { check } from "express-validator";
import ApiError from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPipeline, paginationResult } from "../utils/helper.js";

export const validateDealerData = [
  check("title", " title is required!").notEmpty(),
  check("keyword", "keyword is required!").notEmpty(),
  check("descriptions", "descriptions  is required!").notEmpty(),
  check("noIndex", "noIndex  is required!").notEmpty(),
];

// delete dealer Data
export const deleteDealerData = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const deletedData = await User.findByIdAndDelete(_id);
  if (!deletedData) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Dealer data not found!"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "", "Dealer data deleted successfully!!"));
});

// list of dealer data
export const listDealerData = asyncHandler(async (req, res) => {
  const { role = "dealer", page = 1, limit = 10 } = req.query;
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

//get Dealerdata by id
export const getDealerDataById = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const data = await User.findById(_id).select("-refreshToken -password");
  if (!data) {
    return res.status(404).json(new ApiError(404, null, "invalid id!"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, data, "data fatched successfully"));
});

import { Seo } from "../model/seoModel.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { check, validationResult } from "express-validator";

export const validateSeoData = [
  check("title", " title is required!").notEmpty(),
  check("keyword", "keyword is required!").notEmpty(),
  check("descriptions", "descriptions  is required!").notEmpty(),
  check("noIndex", "noIndex  is required!").notEmpty(),
];

//create  seo data
export const createSeoData = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }
  const { title, keyword, descriptions, noIndex, slug } = req.body;
  const existingSeoData = await Seo.findOne({ title });
  if (existingSeoData) {
    return res
      .status(501)
      .json(new ApiError(500, "", "title related data already exist!"));
  }
  const newSeo = new Seo({
    title,
    slug,
    keyword,
    noIndex,
    descriptions,
  });
  const savedSeo = await newSeo.save();
  res
    .status(200)
    .json(new ApiResponse(200, savedSeo, "Seo Data has been created!..."));
});

// update seo data
export const updateSeoData = asyncHandler(async (req, res) => {
  const { title, keyword, descriptions, noIndex, slug } = req.body;
  const { _id } = req.params;
  const data = await Seo.findById(_id);
  if (!data) {
    return res.status(404).json(new ApiError(404, "", "Seo data not found!"));
  }
  data.title = title || data.title;
  data.keyword = keyword || data.keyword;
  data.descriptions = descriptions || data.descriptions;
  data.noIndex = noIndex || data.noIndex;
  data.slug = slug || data.slug;

  const updatedData = await data.save();
  return res
    .status(200)
    .json(new ApiResponse(200, updatedData, "Seo data updated successfully!!"));
});

// delete Seo Data
export const deleteSeoData = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const seodata = await Seo.findById(_id);
  const deletedData = await Seo.findByIdAndDelete(_id);
  if (!deletedData) {
    return res.status(404).json(new ApiError(404, "", "Seo data not found!"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "", "Seo data deleted successfully!!"));
});

// list of seo data

export const listSeoData = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, title, keyword } = req.query;
  const filter = {};
  if (title) filter.title = { $regex: title, $options: "i" };
  if (keyword) filter.keyword = { $regex: keyword, $options: "i" };

  const totalItems = await Seo.countDocuments(filter);

  const seoData = await Seo.find(filter)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalItems / limit),
    totalItems,
    itemsPerPage: parseInt(limit),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { result: seoData, pagination },
        "Seo data listed successfully!"
      )
    );
});

//get Seodata by id
export const getSeoDataById = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const data = await Seo.findById(_id);
  if (!data) {
    return res.status(404).json(new ApiError(404, "", "invalid Seo data id!"));
  }
  return res.status(200).json(new ApiResponse(200, data));
});

//get Seodata by Slug
export const getSeoDataBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.body;
  try {
    const data = await Seo.findOne({ slug });
    if (!data) return res.status(200).json({ message: "Data not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving data", error });
  }
});

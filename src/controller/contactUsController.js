import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ContactUS } from "../model/contactUs.model.js";
import { contactUsContent } from "../utils/emailContent.js";
import { isValidObjectId, sendMail } from "../utils/helper.js";


const raiseQuery = asyncHandler(async (req, res) => {
  const { senderName, senderEmail, query, senderMobile } = req.body;
  if ([senderName, senderEmail, query, senderMobile].some((field) => field?.trim() === "")) {
    return res
      .status(400)
      .json(new ApiError(400, "", "all fields are mandetory"));
  }

  const raisedQuery = await ContactUS.create({
    query,
    senderName,
    senderEmail,
    senderMobile,
  });
  if (!raisedQuery) {
    return res
      .status(200)
      .json(new ApiError(500, "", "something went wrongwhile raising query! "));
  }
  /*--------------------------------send mail notification to admin--------------------------------------------------*/
  const htmlContent = contactUsContent(senderName, senderEmail, query, senderMobile);
  const subject = "Query raised from unfazed user"
  if (process.env.NODE_ENV !== 'production') {
    sendMail("adarshsrivastav375@gmail.com", subject, htmlContent)
  }
  res.status(200).json(new ApiResponse(200, null, "Query raised."))
});

const changeQueryStatus = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const { status } = req.body;
  if (!isValidObjectId(_id)) {
    return res.status(500).json(new ApiError(500, "", "invalid object id!"));
  }
  const query = await ContactUS.findByIdAndUpdate(
    { _id },
    { status },
    { new: true }
  );
  if (!query) {
    return res
      .status(404)
      .json(new ApiError(404, "", "invalid query request!"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { result: query },
        "Query status changed successfully!"
      )
    );
});

const getQueryList = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
  } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const queryList = await ContactUS.find()
    .sort({ [sort]: order === "desc" ? -1 : 1 })
    .limit(limitNumber)
    .skip((pageNumber - 1) * limitNumber)
    .exec();
  const totalCount = await ContactUS.countDocuments();
  const pagination = {
    currentPage: pageNumber,
    totalPages: Math.ceil(totalCount / limit),
    totalItems: totalCount,
    itemsPerPage: limitNumber,
  };
  if (pagination.currentPage > pagination.totalPages) {
    return res
      .status(404)
      .json(new ApiError(404, "", "No data found for this page!"));
  }
  if (!queryList.length) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Failed to retrive query list!"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { result: queryList, pagination },"list fetched successfully"));
});

// API to get query by ID
 const getQueryById = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!isValidObjectId(_id)) {
    return res.status(400).json(new ApiError(400, "", "Invalid query ID!"));
  }
  const query = await ContactUS.findById(_id);
  if (!query) {
    return res.status(404).json(new ApiError(404, "", "Query not found!"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, query, "Query fetched successfully!"));
});

export { raiseQuery, changeQueryStatus, getQueryList, getQueryById };

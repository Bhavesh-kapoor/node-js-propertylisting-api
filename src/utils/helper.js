import { User } from "../model/user.model.js";
import mongoose from "mongoose";
import crypto from 'crypto';
import { transporter, mailOptions } from "../config/nodeMailerConfig.js";

/*------------------------------------------to generate tokens-------------------------------------------*/
const createAccessOrRefreshToken = async (user_id) => {
  const user = await User.findById(user_id);
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

/*------------------------------------------to check objectId valid--------------------------------------*/
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/*------------------------------------------------generate otp--------------------------------------------*/

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
/*------------------------------------------to send mail-------------------------------------------*/

const sendMail = (receiverEmail, subject, htmlContent) => {
  const options = mailOptions(receiverEmail, subject, htmlContent);
  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log("Error while sending email:", error);
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });
};

/*------------------------------------------create transaction Id------------------------------------------*/
const generateTransactionId = () => {
  return "TXN_" + crypto.randomBytes(6).toString('hex').toUpperCase();
};

function extractS3KeyFromUrl(url) {
  const s3Domain = 's3.ap-south-1.amazonaws.com';
  const bucketName = 'wedding';

  const regex = new RegExp(`https://${bucketName}\\.${s3Domain}/(.+)`);
  const match = url.match(regex);

  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  throw new Error('Invalid S3 URL or mismatch with bucket domain');
}

const getPipeline = (query) => {
  const {
    role,
    status,
    endDate,
    page = 1,
    startDate,
    searchkey,
    limit = 10,
    search = "",
    sortdir = "desc",
    sortkey = "createdAt",
  } = query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const pipeline = [];
  const matchStage = {};

  if (role) matchStage.role = role;
  if (search && searchkey)
    matchStage[searchkey] = { $regex: search, $options: "i" };

  if (status) matchStage.status = status;

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  if (Object.keys(matchStage).length > 0) pipeline.push({ $match: matchStage });

  const sortStage = {
    $sort: { [sortkey]: sortdir === "asc" ? 1 : -1 },
  };
  pipeline.push(sortStage);
  pipeline.push({ $skip: (pageNumber - 1) * limitNumber });
  pipeline.push({ $limit: limitNumber });

  const options = {
    collation: {
      locale: "en",
      strength: 2, // Case-insensitive collation
    },
  };

  return { pipeline, matchStage, options };
};
const paginationResult = (
  pageNumber,
  limitNumber,
  totalResuts,
  results
) => {
  return {
    result: results,
    pagination: {
      currentPage: pageNumber,
      totalItems: totalResuts,
      itemsPerPage: limitNumber,
      totalPages: Math.ceil(totalResuts / limitNumber),
    },
  };
};

export { createAccessOrRefreshToken, isValidObjectId, generateOTP, sendMail, generateTransactionId, extractS3KeyFromUrl, getPipeline, paginationResult }
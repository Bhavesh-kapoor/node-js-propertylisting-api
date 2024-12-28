import { Transaction } from "../model/transaction.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { SubscriptionPlan } from "../model/subscriptionPlan.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { isValidObjectId } from "../utils/helper.js";
import { createOrder as initiateOrder } from "../config/razorPayConfig.js";
import { uid } from "uid";
import { razorpay } from "../config/razorPayConfig.js";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";

/*-----------------------------------------create order-----------------------------------------*/

const createOrder = asyncHandler(async (req, res) => {
  const { subscriptionId, currency = "INR", duration } = req.body;
  const user = req.user;

  if (!subscriptionId) {
    throw new ApiError(400, "Invalid subscription ID");
  }
  if (!isValidObjectId(subscriptionId)) {
    throw new ApiError(400, "Invalid subscription ID");
  }
  const subscription = await SubscriptionPlan.findOne({ _id: subscriptionId });
  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }
  const SubscribedPlan = await SubscribedPlan.findOne({
    userId: user._id,
    planId: subscriptionId,
  });
  if (SubscribedPlan) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "this plan is already active"));
  }
  const amountToPay = subscription.price[duration];
  const transactionId = `TXN_${uid()}`;
  let response;
  try {
    response = await initiateOrder(amountToPay, transactionId, currency);
  } catch (error) {
    throw new ApiError(error.statusCode, error.error);
  }
  const transaction = new Transaction({
    userId: user._id,
    transactionId: response.order_id,
    subscription: subscription._id,
    amount: subscription.price[duration],
    currency: currency,
    status: "initiated",
    duration: duration,
  });
  await transaction.save();
  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...response,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
      "Order initiated successfully"
    )
  );
});

const verifyOrder = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const secret = process.env.CLIENT_SECRET;
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  try {
    const isValidSignature = validateWebhookSignature(
      body,
      razorpay_signature,
      secret
    );
    console.log("isValidSignature", isValidSignature);

    if (!isValidSignature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    console.log("payment", payment);
    const transaction = await Transaction.findOne({
      $or: [
        { transactionId: razorpay_order_id },
        { transactionId: razorpay_payment_id },
      ],
    });
    console.log("transaction", transaction);
    transaction.transactionId = payment.id;
    req.paymentDetails = payment;
    req.transaction = transaction;
    next();
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    return res
      .status(500)
      .json({ error: "Error verifying payment", details: error.message });
  }
});

export { createOrder, verifyOrder };

import { Transaction } from "../model/transaction.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { SubscriptionPlan } from "../model/subscriptionPlan.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { isValidObjectId } from "../utils/helper.js";
import { createOrder as initiateOrder } from "../config/razorPayConfig.js";
import { uid } from 'uid';
/*-----------------------------------------create order-----------------------------------------*/
const createOrder = asyncHandler(async (req, res) => {
    const { subscriptionId, currency = 'INR' } = req.body;
    const user = req.user;

    if (!subscriptionId) {
        throw new ApiError(400, 'Invalid subscription ID');
    }
    if (!isValidObjectId(subscriptionId)) {
        throw new ApiError(400, 'Invalid subscription ID');
    }
    const subscription = await SubscriptionPlan.findOne({ _id: subscriptionId });
    if (!subscription) {
        throw new ApiError(404, 'Subscription not found');
    }
    const amountToPay = subscription.price;
    const transactionId = `TXN_${uid()}`
    const response = await initiateOrder(amountToPay, transactionId, currency);
    const transaction = new Transaction({
        userId: user._id,
        transactionId: transactionId,
        subscription: subscription._id,
        amount: subscription.price,
        currency: currency,
        status: "initiated",
    });
    await transaction.save();
    res.status(200).json(new ApiResponse(200, {
        ...response, name: user.name,
        email: user.email,
        mobile: user.mobile
    }, 'Order initiated successfully'));
})


export { createOrder };
import Razorpay from "razorpay";
import asyncHandler from "../utils/asyncHandler.js";

const razorpay = new Razorpay({
  key_id: process.env.CLIENT_ID,
  key_secret: process.env.CLIENT_SECRET,
});

const createOrder = async (amount, orderId, currency) => {
  const options = {
    amount: amount * 100, // amount in smallest currency unit (paise for INR)
    currency: currency,//'INR'
    receipt: orderId,
    payment_capture: 1 // auto capture
  };
  const order = await razorpay.orders.create(options);
  return ({
    order_id: order.id,
    currency: order.currency,
    amount: order.amount,
    receipt: order.receipt
  });

};


export { razorpay, createOrder }
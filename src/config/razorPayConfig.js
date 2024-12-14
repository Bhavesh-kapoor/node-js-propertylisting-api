import Razorpay from "razorpay";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import asyncHandler from "../utils/asyncHandler.js";

const razorpay = new Razorpay({
  key_id: process.env.CLIENT_ID,
  key_secret: process.env.CLIENT_SECRET,
});

const createOrder = async (amount, orderId, currency) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyOrder = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const secret = process.env.CLIENT_SECRET;
  const body = razorpay_order_id + '|' + razorpay_payment_id;

  try {
    // Verify the signature
    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
    console.log("isValidSignature", isValidSignature)

    if (!isValidSignature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // const transaction = await Transaction.findOne({
    //   $or: [
    //     { transactionId: razorpay_order_id },
    //     { transactionId: razorpay_payment_id },
    //   ],
    // });
    // transaction.transactionId = payment.id
    // req.paymentDetails = payment;
    // req.transaction = transaction
    next();
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    return res.status(500).json({ error: "Error verifying payment", details: error.message });
  }
});
export { razorpay, createOrder, verifyOrder }
import Razorpay from "razorpay";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";

const razorpay = new Razorpay({
    key_id: process.env.CLIENT_ID,
    key_secret: process.env.CLIENT_SECRET,
});

const createOrder = async (amount,orderId,currency) => {
    try {
        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise for INR)
            currency: currency,//'INR'
            receipt: orderId,
            payment_capture: 1 // auto capture
        };

        const order = await razorpay.orders.create(options);
        console.log(order);
        return({
            order_id: order.id,
            currency: order.currency,
            amount: order.amount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyOrder = (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
    const secret = razorpay.key_secret;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
  
    try {
      const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
      if (isValidSignature) {
        res.status(200).json({ status: 'ok' });
        console.log("Payment verification successful");
      } else {
        res.status(400).json({ status: 'verification_failed' });
        console.log("Payment verification failed");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Error verifying payment' });
    }
  }
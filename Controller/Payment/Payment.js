const Payment = require("../../Model/Payment/Payment");
const {
  razorpay,
  keyId,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require("../../Utils/razorpay");

// Server-controlled price. Never trust an amount sent by the client.
const PROPERTY_UPLOAD_AMOUNT_PAISE = 19900; // ₹199

class PaymentController {
  // Create a Razorpay order for a property-upload fee.
  async createOrder(req, res) {
    try {
      const { customerId } = req.body;
      if (!customerId) {
        return res
          .status(400)
          .json({ status: false, message: "customerId is required." });
      }
      if (!razorpay) {
        return res
          .status(503)
          .json({ status: false, message: "Payments are not configured." });
      }

      const order = await razorpay.orders.create({
        amount: PROPERTY_UPLOAD_AMOUNT_PAISE,
        currency: "INR",
        receipt: `prop_${Date.now()}`,
        notes: { customerId, purpose: "property_upload" },
      });

      await Payment.create({
        customerId,
        orderId: order.id,
        amount: PROPERTY_UPLOAD_AMOUNT_PAISE,
        currency: "INR",
        status: "created",
        purpose: "property_upload",
      });

      return res.status(200).json({
        status: true,
        orderId: order.id,
        amount: PROPERTY_UPLOAD_AMOUNT_PAISE,
        currency: "INR",
        keyId, // public key id for the checkout
      });
    } catch (error) {
      console.error("createOrder error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Failed to create order." });
    }
  }

  // Verify the checkout signature and mark the order paid.
  async verifyPayment(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res
          .status(400)
          .json({ status: false, message: "Missing payment fields." });
      }

      const ok = verifyPaymentSignature({
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!ok) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid payment signature." });
      }

      const payment = await Payment.findOne({ orderId: razorpay_order_id });
      if (!payment) {
        return res
          .status(404)
          .json({ status: false, message: "Order not found." });
      }

      // Don't downgrade an already-consumed payment.
      if (payment.status !== "used") {
        payment.status = "paid";
        payment.paymentId = razorpay_payment_id;
        await payment.save();
      }

      return res
        .status(200)
        .json({ status: true, message: "Payment verified." });
    } catch (error) {
      console.error("verifyPayment error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Failed to verify payment." });
    }
  }

  // Razorpay webhook (reliability backstop). Mounted with a raw body parser.
  async webhook(req, res) {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const raw = req.body; // Buffer (express.raw)
      if (!verifyWebhookSignature(raw, signature)) {
        return res.status(400).json({ status: false, message: "Bad signature" });
      }

      const event = JSON.parse(raw.toString("utf8"));
      if (
        event.event === "payment.captured" ||
        event.event === "order.paid"
      ) {
        const orderId =
          event.payload?.payment?.entity?.order_id ||
          event.payload?.order?.entity?.id;
        const paymentId = event.payload?.payment?.entity?.id;
        if (orderId) {
          const payment = await Payment.findOne({ orderId });
          if (payment && payment.status === "created") {
            payment.status = "paid";
            if (paymentId) payment.paymentId = paymentId;
            await payment.save();
          }
        }
      }

      return res.status(200).json({ status: true });
    } catch (error) {
      console.error("webhook error:", error.message);
      // Always 200 so Razorpay doesn't retry forever on our parse bugs.
      return res.status(200).json({ status: false });
    }
  }
}

module.exports = new PaymentController();

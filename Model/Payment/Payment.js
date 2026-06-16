const mongoose = require("mongoose");

// One document per Razorpay order. Lifecycle:
//   created  -> order made, awaiting payment
//   paid     -> signature verified, ready to consume
//   used     -> consumed by a created property (one payment = one listing)
//   failed   -> payment failed
const PaymentSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String },
    amount: { type: Number, required: true }, // paise
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "used", "failed"],
      default: "created",
    },
    purpose: { type: String, default: "property_upload" },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;

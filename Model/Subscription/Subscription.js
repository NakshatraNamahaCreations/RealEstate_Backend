const mongoose = require("mongoose");

// A user's subscription to a Plan. Created when a user subscribes (or an admin
// assigns a plan), and queried to know who is currently subscribed.
const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    // Snapshot of what was paid, kept even if the plan price later changes.
    amountPaid: { type: Number, default: 0 },
    // Optional payment-gateway reference for reconciliation.
    paymentRef: { type: String, default: "" },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Subscription", SubscriptionSchema);

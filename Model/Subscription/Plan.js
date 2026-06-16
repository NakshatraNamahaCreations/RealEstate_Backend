const mongoose = require("mongoose");

// A subscription plan the admin defines (the catalogue). Users subscribe to a
// plan, producing a Subscription document.
const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    // Price in the smallest sensible unit you bill in (e.g. INR rupees).
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    // Billing period length in days (e.g. 30, 90, 365).
    durationDays: { type: Number, required: true, min: 1 },
    // Free-form perks shown on the plan card.
    features: { type: [String], default: [] },
    // Optional cap on how many listings the plan allows (null = unlimited).
    listingLimit: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);

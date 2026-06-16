const mongoose = require("mongoose");

const EnquirySchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    userId: { type: String, required: true },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sellproperty",
      required: true,
    },
    // Optional note the enquirer can send to the owner.
    message: { type: String, default: "" },
    // Lifecycle of the enquiry. Replaces the old `accepted` boolean so that
    // "not yet actioned" (pending) is distinct from an explicit "reject".
    status: {
      type: String,
      enum: ["pending", "accept", "reject"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// One active enquiry per (user, property). A partial unique index lets a user
// enquire again only after a previous enquiry was rejected.
EnquirySchema.index(
  { userId: 1, propertyId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "accept"] } },
  }
);

const Enquiry = mongoose.model("Enquiry", EnquirySchema);
module.exports = Enquiry;

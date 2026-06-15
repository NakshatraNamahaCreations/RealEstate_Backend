const mongoose = require("mongoose");

// One OTP record per phone number (upserted on resend). The stored value is a
// bcrypt hash, never the plain code. `expiresAt` carries a TTL index so Mongo
// removes stale records automatically.
const OtpSchema = new mongoose.Schema(
  {
    phonenumber: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TTL index: documents are deleted once `expiresAt` passes.
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model("Otp", OtpSchema);
module.exports = Otp;

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // Phone is now the primary identity (OTP login). It is the only required
  // field; the rest are collected progressively (name after OTP, the others
  // via profile updates).
  phonenumber: { type: Number, required: true, unique: true },
  userName: { type: String },
  email: { type: String },
  password: { type: String },
  gender: { type: String },
  professional: { type: String },
  socialmedialink: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // FCM device tokens (one per device) for push notifications.
  fcmTokens: { type: [String], default: [] },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;

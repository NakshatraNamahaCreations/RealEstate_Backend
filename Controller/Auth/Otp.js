const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Otp = require("../../Model/Auth/Otp");
const User = require("../../Model/Auth/User");
const { sendOtpSms } = require("../../Utils/sms");

const OTP_LENGTH = Number(process.env.OTP_LENGTH) || 6;
const OTP_EXP_MINUTES = Number(process.env.OTP_EXP_MINUTES) || 5;
const RESEND_COOLDOWN_MS = 30 * 1000; // min gap between sends for a number
const MAX_VERIFY_ATTEMPTS = 5;

const isValidPhone = (p) => /^\d{10}$/.test(String(p || "").trim());

// Cryptographically-random numeric code of OTP_LENGTH digits, zero-padded.
const generateOtp = () => {
  const max = 10 ** OTP_LENGTH;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(OTP_LENGTH, "0");
};

class OtpController {
  async sendOtp(req, res) {
    try {
      const phonenumber = String(req.body.phonenumber || "").trim();

      if (!isValidPhone(phonenumber)) {
        return res
          .status(400)
          .json({ status: false, message: "A valid 10-digit phone number is required." });
      }

      // Throttle resends.
      const existing = await Otp.findOne({ phonenumber });
      if (
        existing &&
        existing.lastSentAt &&
        Date.now() - new Date(existing.lastSentAt).getTime() < RESEND_COOLDOWN_MS
      ) {
        return res.status(429).json({
          status: false,
          message: "Please wait a few seconds before requesting another OTP.",
        });
      }

      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

      // DEV aid: print the OTP so you can complete login while SMS delivery is
      // being sorted out. Suppressed when NODE_ENV=production.
      if (process.env.NODE_ENV !== "production") {
        console.log(`🔑 [DEV] OTP for ${phonenumber} = ${otp}`);
      }

      await Otp.findOneAndUpdate(
        { phonenumber },
        { phonenumber, otpHash, expiresAt, attempts: 0, lastSentAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      try {
        await sendOtpSms(phonenumber, otp);
      } catch (smsError) {
        console.error("Error sending OTP SMS:", smsError.message);
        // Don't leave a usable OTP behind if delivery failed.
        await Otp.deleteOne({ phonenumber });
        return res.status(502).json({
          status: false,
          // Surface the provider's reason so the cause is visible client-side too.
          message: `Failed to send OTP: ${smsError.message}`,
        });
      }

      return res.status(200).json({ status: true, message: "OTP sent successfully." });
    } catch (error) {
      console.error("Error in sendOtp:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  }

  async verifyOtp(req, res) {
    try {
      const phonenumber = String(req.body.phonenumber || "").trim();
      const otp = String(req.body.otp || "").trim();

      if (!isValidPhone(phonenumber) || !otp) {
        return res
          .status(400)
          .json({ status: false, message: "Phone number and OTP are required." });
      }

      const record = await Otp.findOne({ phonenumber });

      if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
        return res
          .status(400)
          .json({ status: false, message: "OTP is invalid or has expired." });
      }

      if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
        await Otp.deleteOne({ phonenumber });
        return res.status(429).json({
          status: false,
          message: "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      const isMatch = await bcrypt.compare(otp, record.otpHash);
      if (!isMatch) {
        record.attempts += 1;
        await record.save();
        return res.status(400).json({ status: false, message: "Incorrect OTP." });
      }

      // Success — consume the OTP and find-or-create the user by phone.
      await Otp.deleteOne({ phonenumber });

      let user = await User.findOne({ phonenumber });
      if (!user) {
        user = await User.create({ phonenumber });
      }

      const isNewUser = !user.userName; // empty name => still needs onboarding

      return res.status(200).json({
        status: true,
        isNewUser,
        message: "OTP verified successfully.",
        data: {
          id: user._id,
          userName: user.userName || "",
          email: user.email || "",
          phonenumber: user.phonenumber,
        },
      });
    } catch (error) {
      console.error("Error in verifyOtp:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  }
}

module.exports = new OtpController();

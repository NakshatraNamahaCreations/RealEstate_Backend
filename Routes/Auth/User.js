const { Router } = require("express");
const router = Router();
const UserController = require("../../Controller/Auth/User");
const OtpController = require("../../Controller/Auth/Otp");

// OTP login (primary auth)
router.post("/send-otp", OtpController.sendOtp);
router.post("/verify-otp", OtpController.verifyOtp);

// Legacy email/password endpoints — retained for now, unused by the app.
router.post("/usersignup", UserController.UserSignup);
router.post("/usersignin", UserController.UserSignin);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password", UserController.resetPassword);
router.get("/alluser", UserController.getAlluser);
router.put("/updateusers/:userId", UserController.updateUser);

// Push notifications — register a device's FCM token.
router.post("/save-fcm-token", UserController.saveFcmToken);

module.exports = router;

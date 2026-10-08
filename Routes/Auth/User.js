const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const router = Router();
const UserController = require("../../Controller/Auth/User");
const OtpController = require("../../Controller/Auth/Otp");
const { profileStorage } = require("../../Utils/cloudinary");

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return cb(null, true);
    cb(new Error("Only .jpg, .jpeg, .png or .webp images are allowed."));
  },
});

// OTP login (primary auth)
router.post("/send-otp", OtpController.sendOtp);
router.post("/verify-otp", OtpController.verifyOtp);

// Legacy email/password endpoints — retained for now, unused by the app.
router.post("/usersignup", UserController.UserSignup);
router.post("/usersignin", UserController.UserSignin);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password", UserController.resetPassword);
router.get("/alluser", UserController.getAlluser);
router.get("/userbyid/:userId", UserController.getUserById);
router.put("/updateusers/:userId", UserController.updateUser);
router.post("/userprofileimage/:userId", (req, res) => {
  profileUpload.single("profileimage")(req, res, (err) => {
    if (err) {
      console.error("[profileImage] upload rejected:", err.message);
      return res.status(400).json({ status: false, message: err.message });
    }
    UserController.uploadProfileImage(req, res);
  });
});

// Push notifications — register a device's FCM token.
router.post("/save-fcm-token", UserController.saveFcmToken);

module.exports = router;

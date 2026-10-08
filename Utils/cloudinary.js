const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const propertyStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "30forty/sellproperty",
    resource_type: "image",
    public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  }),
});

// User profile photos (one per user; the old one is removed on replace).
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "30forty/profile",
    resource_type: "image",
    public_id: `${req.params.userId}-${Date.now()}`,
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    // Avatars are shown small — store a 512px square, face-centred crop.
    transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }],
  }),
});

module.exports = { cloudinary, propertyStorage, profileStorage };

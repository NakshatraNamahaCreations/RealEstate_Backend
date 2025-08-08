const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertiesByCity,
  getPropertiesByType,
  getPropertyByDetails,
  getPropertyByIDandType,
  toggleFavorite,
  getFavoritePropertiesByCustomer,
  searchProperties,
} = require("../../Controller/Sellproperty/Sellproperty");

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Public/sellproperty");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    console.log("Uploading file:", file.originalname, "with ext:", ext);
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files (.jpg, .jpeg, .png, .webp, .gif) are allowed."
        )
      );
    }
  },
});

const router = express.Router();

router.post("/properties", (req, res) => {
  upload.array("propertyimage", 10)(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    createProperty(req, res);
  });
});

router.put("/properties/:id", (req, res) => {
  upload.array("propertyimage", 10)(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    updateProperty(req, res);
  });
});
router.get("/properties", getAllProperties);
router.get("/properties/:id", getPropertyById);
router.delete("/properties/:id", deleteProperty);
router.get("/properties/city", getPropertiesByCity);
router.get("/properties/type", getPropertiesByType);
router.get("/properties/:propertyId/:customerId/:type", getPropertyByDetails);
router.get("/getPropertyByIDandType/:propertyId/:type", getPropertyByIDandType);
router.put("/favorite/:propertyId", toggleFavorite);
router.get("/property/favorites/:customerId", getFavoritePropertiesByCustomer);
router.post("/search", searchProperties);

module.exports = router;

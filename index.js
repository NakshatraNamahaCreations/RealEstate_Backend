require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

// Routes
const sellpropertyRoutes = require("./Routes/Sellproperty/Sellproperty");
const favoriteRoutes = require("./Routes/Sellproperty/Favorite");
const userRoute = require("./Routes/Auth/User");
const AdminuserRoute = require("./Routes/Auth/Admin");
const EnquiryRoute = require("./Routes/Enquiry/Enquiry");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Static files
app.use(
  "/sellproperty",
  express.static(path.join(__dirname, "Public/sellproperty"))
);

// API routes
app.use("/api/sell", sellpropertyRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", AdminuserRoute);
app.use("/api/enquiry", EnquiryRoute);
app.use("/api", userRoute);

// Health check endpoint
app.get("/healthz", (req, res) => {
  const state = mongoose.connection.readyState; // 1 = connected
  res.json({ ok: state === 1, state });
});

// MongoDB Connection
const MONGO_URI = process.env.CONTENT_MONGO_URI;
const PORT = process.env.PORT || 8001;

(async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("CONTENT_MONGO_URI is missing in .env");
    }

    mongoose.set("strictQuery", true);

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ Connected to MongoDB");

    // Start server only after DB connects
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
})();

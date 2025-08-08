require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const sellpropertyRoutes = require("./Routes/Sellproperty/Sellproperty");
const favoriteRoutes = require("./Routes/Sellproperty/Favorite");
const userRoute = require("./Routes/Auth/User");
const AdminuserRoute = require("./Routes/Auth/Admin");
const EnquiryRoute = require("./Routes/Enquiry/Enquiry");
const path = require("path");
const multer = require("multer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  "/sellproperty",
  express.static(path.join(__dirname, "Public/sellproperty"))
);

app.use("/api/sell", sellpropertyRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", AdminuserRoute);
app.use("/api/enquiry", EnquiryRoute);
app.use("/api", userRoute);

const PORT = process.env.CONTENT_PORT || 8001;
const MONGO_URI = process.env.CONTENT_MONGO_URI;

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

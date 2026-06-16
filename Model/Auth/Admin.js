const mongoose = require("mongoose");

const AdminUserSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    // "superadmin" can manage other admins; "admin" is regular staff access.
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

const adminUser = mongoose.model("Adminuser", AdminUserSchema);
module.exports = adminUser;

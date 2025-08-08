const mongoose = require("mongoose");

const AdminUserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const adminUser = mongoose.model("Adminuser", AdminUserSchema);
module.exports = adminUser;

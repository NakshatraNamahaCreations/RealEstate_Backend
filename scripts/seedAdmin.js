// Seed (or reset) a super admin account.
//
// Usage:
//   node scripts/seedAdmin.js <email> <password> [name]
//
// Re-running with an existing email resets that admin's password and promotes
// them to super admin. Safe to run multiple times.
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const adminUser = require("../Model/Auth/Admin");

(async () => {
  const [, , emailArg, passwordArg, nameArg] = process.argv;
  const email = (emailArg || "").toLowerCase().trim();
  const password = passwordArg || "";

  if (!email || !password) {
    console.error("Usage: node scripts/seedAdmin.js <email> <password> [name]");
    process.exit(1);
  }

  const MONGO_URI = process.env.CONTENT_MONGO_URI;
  if (!MONGO_URI) {
    console.error("CONTENT_MONGO_URI is missing in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    const hashed = await bcrypt.hash(password, 10);

    const admin = await adminUser.findOneAndUpdate(
      { email },
      {
        email,
        password: hashed,
        role: "superadmin",
        isActive: true,
        ...(nameArg ? { name: nameArg } : {}),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Super admin ready: ${admin.email} (id: ${admin._id})`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
})();

const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!SECRET) {
  // Fail loud at boot rather than silently issuing unverifiable tokens.
  console.error(
    "⚠️  JWT_SECRET is not set in .env — admin auth will not work."
  );
}

// Sign a token for an authenticated admin.
const signAdminToken = (admin) =>
  jwt.sign(
    { id: String(admin._id), email: admin.email, role: admin.role },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );

// Verify and decode a token. Throws if invalid/expired.
const verifyToken = (token) => jwt.verify(token, SECRET);

module.exports = { signAdminToken, verifyToken };

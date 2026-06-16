const { verifyToken } = require("../Utils/jwt");
const adminUser = require("../Model/Auth/Admin");

// Pull a Bearer token from the Authorization header.
const tokenFromHeader = (req) => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
};

// Require a valid admin JWT. Attaches the live admin doc to req.admin so
// downstream handlers can read role/email and so a deactivated admin is
// rejected even with an otherwise-valid token.
const requireAdmin = async (req, res, next) => {
  try {
    const token = tokenFromHeader(req);
    if (!token) {
      return res
        .status(401)
        .json({ status: false, message: "Authentication required." });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (_) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid or expired session." });
    }

    const admin = await adminUser.findById(payload.id).select("-password");
    if (!admin || admin.isActive === false) {
      return res
        .status(401)
        .json({ status: false, message: "Admin account not found or disabled." });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("requireAdmin error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Auth check failed." });
  }
};

// Require the authenticated admin to be a super admin. Use after requireAdmin.
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== "superadmin") {
    return res
      .status(403)
      .json({ status: false, message: "Super admin access required." });
  }
  next();
};

module.exports = { requireAdmin, requireSuperAdmin };

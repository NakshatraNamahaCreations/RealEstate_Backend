const adminUser = require("../../Model/Auth/Admin");
const bcrypt = require("bcrypt");
const { sendToTopic } = require("../../Utils/fcm");
const { signAdminToken } = require("../../Utils/jwt");

// Emails permitted to self-register the FIRST super admin via /signup. Once an
// admin exists, signup is locked to super admins (createAdmin) instead.
const bootstrapEmails = (process.env.ADMIN_BOOTSTRAP_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const publicAdmin = (a) => ({
  id: a._id,
  name: a.name,
  email: a.email,
  role: a.role,
  isActive: a.isActive,
  createdAt: a.createdAt,
  lastLoginAt: a.lastLoginAt,
});

class AdminController {
  // Bootstrap signup: only works for whitelisted emails AND only until the
  // first admin exists. The first admin is created as a super admin.
  async AdminUserSignup(req, res) {
    try {
      const { name, password } = req.body;
      const email = (req.body.email || "").toLowerCase().trim();

      if (!password || !email) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      const adminCount = await adminUser.countDocuments();
      if (adminCount > 0) {
        return res.status(403).json({
          message:
            "Admin signup is closed. Ask a super admin to create your account.",
        });
      }
      if (bootstrapEmails.length && !bootstrapEmails.includes(email)) {
        return res
          .status(403)
          .json({ message: "This email is not allowed to bootstrap an admin." });
      }

      const existingUser = await adminUser.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists!" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await adminUser.create({
        name: name || "",
        email,
        password: hashedPassword,
        role: "superadmin", // first admin bootstraps as super admin
      });

      return res.status(200).json({
        message: "Super admin created successfully!",
        user: publicAdmin(newUser),
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async AdminUserSignin(req, res) {
    try {
      const email = (req.body.email || "").toLowerCase().trim();
      const { password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ status: false, error: "Email and password are required." });
      }

      const existingUser = await adminUser.findOne({ email });
      if (!existingUser) {
        return res.status(404).json({ status: false, error: "Admin not found!" });
      }
      if (existingUser.isActive === false) {
        return res
          .status(403)
          .json({ status: false, error: "This admin account is disabled." });
      }

      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ status: false, error: "Invalid password!" });
      }

      existingUser.lastLoginAt = new Date();
      await existingUser.save();

      const token = signAdminToken(existingUser);

      return res.status(200).json({
        status: true,
        message: "Signed in successfully!",
        token,
        data: publicAdmin(existingUser),
      });
    } catch (error) {
      console.error("Error signing in admin:", error);
      return res
        .status(500)
        .json({ status: false, error: "Internal server error" });
    }
  }

  // Current admin (from the token). Protected by requireAdmin.
  async me(req, res) {
    return res.status(200).json({ status: true, data: publicAdmin(req.admin) });
  }

  // Change own password. Protected by requireAdmin.
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: false,
          message: "currentPassword and newPassword are required.",
        });
      }

      const admin = await adminUser.findById(req.admin._id);
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ status: false, message: "Current password is incorrect." });
      }

      admin.password = await bcrypt.hash(newPassword, 10);
      await admin.save();
      return res
        .status(200)
        .json({ status: true, message: "Password updated." });
    } catch (error) {
      console.error("changePassword error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  }

  // Super-admin: create another admin account.
  async createAdmin(req, res) {
    try {
      const { name, password, role } = req.body;
      const email = (req.body.email || "").toLowerCase().trim();

      if (!email || !password) {
        return res
          .status(400)
          .json({ status: false, message: "Email and password are required." });
      }
      const existing = await adminUser.findOne({ email });
      if (existing) {
        return res
          .status(400)
          .json({ status: false, message: "An admin with this email exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const created = await adminUser.create({
        name: name || "",
        email,
        password: hashedPassword,
        role: role === "superadmin" ? "superadmin" : "admin",
      });

      return res
        .status(201)
        .json({ status: true, message: "Admin created.", data: publicAdmin(created) });
    } catch (error) {
      console.error("createAdmin error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  }

  // Super-admin: list all admin accounts.
  async listAdmins(req, res) {
    try {
      const admins = await adminUser.find().select("-password").sort({ createdAt: -1 });
      return res
        .status(200)
        .json({ status: true, data: admins.map(publicAdmin) });
    } catch (error) {
      console.error("listAdmins error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  }

  // Super-admin: enable/disable or delete an admin (cannot act on self).
  async setAdminActive(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (String(id) === String(req.admin._id)) {
        return res
          .status(400)
          .json({ status: false, message: "You cannot disable your own account." });
      }
      const admin = await adminUser.findByIdAndUpdate(
        id,
        { isActive: !!isActive },
        { new: true }
      ).select("-password");
      if (!admin) {
        return res.status(404).json({ status: false, message: "Admin not found." });
      }
      return res.status(200).json({ status: true, data: publicAdmin(admin) });
    } catch (error) {
      console.error("setAdminActive error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  }

  async deleteAdmin(req, res) {
    try {
      const { id } = req.params;
      if (String(id) === String(req.admin._id)) {
        return res
          .status(400)
          .json({ status: false, message: "You cannot delete your own account." });
      }
      const admin = await adminUser.findByIdAndDelete(id);
      if (!admin) {
        return res.status(404).json({ status: false, message: "Admin not found." });
      }
      return res.status(200).json({ status: true, message: "Admin deleted." });
    } catch (error) {
      console.error("deleteAdmin error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  }

  // Broadcast a push notification to every device subscribed to the "all"
  // topic. Protected by requireAdmin at the route layer.
  async broadcast(req, res) {
    try {
      const { title, body } = req.body;
      if (!title || !body) {
        return res
          .status(400)
          .json({ status: false, message: "title and body are required." });
      }

      await sendToTopic("all", { title, body, data: { type: "broadcast" } });

      return res.status(200).json({ status: true, message: "Broadcast sent." });
    } catch (error) {
      console.error("Error in broadcast:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  }
}

module.exports = new AdminController();

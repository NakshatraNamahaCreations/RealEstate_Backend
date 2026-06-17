const { Router } = require("express");
const router = Router();

const AdminController = require("../../Controller/Auth/Admin");
const AdminUsers = require("../../Controller/Admin/AdminUsers");
const AdminProperties = require("../../Controller/Admin/AdminProperties");
const AdminEnquiries = require("../../Controller/Admin/AdminEnquiries");
const AdminDashboard = require("../../Controller/Admin/AdminDashboard");
const Subscription = require("../../Controller/Subscription/Subscription");
const { requireAdmin, requireSuperAdmin } = require("../../Middleware/auth");

/* ------------------------------- Public auth ------------------------------- */
// Bootstrap signup (locked once an admin exists) + login.
router.post("/signup", AdminController.AdminUserSignup);
router.post("/signin", AdminController.AdminUserSignin);

/* ----------------------- Everything below requires auth ---------------------- */
router.use(requireAdmin);

// Current admin / self-service
router.get("/me", AdminController.me);
router.put("/change-password", AdminController.changePassword);

// Dashboard
router.get("/dashboard/stats", AdminDashboard.getStats);

// Push broadcast + targeted notification
router.post("/broadcast", AdminController.broadcast);
router.post("/notify", AdminController.notifyUsers);

// ---- App users ----
router.get("/users", AdminUsers.listUsers);
router.get("/users/:id", AdminUsers.getUser);
router.put("/users/:id/status", AdminUsers.setUserStatus);
router.delete("/users/:id", AdminUsers.deleteUser);

// ---- Properties (Sell / Rent / PG via filters) ----
router.get("/properties", AdminProperties.listProperties);
router.get("/properties/:id", AdminProperties.getProperty);
router.put("/properties/:id/approval", AdminProperties.setApprovalStatus);
router.put("/properties/:id/featured", AdminProperties.setFeatured);
router.put("/properties/:id/active", AdminProperties.setActive);
router.delete("/properties/:id", AdminProperties.deleteProperty);

// ---- Enquiries ----
router.get("/enquiries", AdminEnquiries.listEnquiries);
router.delete("/enquiries/:id", AdminEnquiries.deleteEnquiry);

// ---- Subscription plans (catalogue) ----
router.get("/plans", Subscription.listPlansAdmin);
router.post("/plans", Subscription.createPlan);
router.put("/plans/:id", Subscription.updatePlan);
router.delete("/plans/:id", Subscription.deletePlan);

// ---- User subscriptions ----
router.get("/subscriptions", Subscription.listSubscriptions);
router.post("/subscriptions/assign", Subscription.assignSubscription);
router.put("/subscriptions/:id/cancel", Subscription.cancelSubscription);

/* --------------------- Super-admin only: manage admins --------------------- */
router.get("/admins", requireSuperAdmin, AdminController.listAdmins);
router.post("/admins", requireSuperAdmin, AdminController.createAdmin);
router.put("/admins/:id/active", requireSuperAdmin, AdminController.setAdminActive);
router.delete("/admins/:id", requireSuperAdmin, AdminController.deleteAdmin);

module.exports = router;

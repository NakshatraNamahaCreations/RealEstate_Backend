const Plan = require("../../Model/Subscription/Plan");
const Subscription = require("../../Model/Subscription/Subscription");
const User = require("../../Model/Auth/User");
const { sendToUser } = require("../../Utils/fcm");

const addDays = (date, days) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

/* ----------------------------- PLANS (catalogue) ----------------------------- */

// POST /api/admin/plans  (admin)
exports.createPlan = async (req, res) => {
  try {
    const { name, price, durationDays } = req.body;
    if (!name || price == null || !durationDays) {
      return res.status(400).json({
        status: false,
        message: "name, price and durationDays are required.",
      });
    }
    const plan = await Plan.create({
      name,
      description: req.body.description || "",
      price,
      currency: req.body.currency || "INR",
      durationDays,
      features: Array.isArray(req.body.features) ? req.body.features : [],
      listingLimit: req.body.listingLimit ?? null,
      isActive: req.body.isActive !== undefined ? !!req.body.isActive : true,
    });
    return res.status(201).json({ status: true, data: plan });
  } catch (error) {
    console.error("createPlan error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// PUT /api/admin/plans/:id  (admin)
exports.updatePlan = async (req, res) => {
  try {
    const allowed = [
      "name",
      "description",
      "price",
      "currency",
      "durationDays",
      "features",
      "listingLimit",
      "isActive",
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const plan = await Plan.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!plan) {
      return res.status(404).json({ status: false, message: "Plan not found." });
    }
    return res.status(200).json({ status: true, data: plan });
  } catch (error) {
    console.error("updatePlan error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// DELETE /api/admin/plans/:id  (admin)
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ status: false, message: "Plan not found." });
    }
    return res.status(200).json({ status: true, message: "Plan deleted." });
  } catch (error) {
    console.error("deletePlan error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// GET /api/admin/plans  (admin) — all plans incl. inactive.
exports.listPlansAdmin = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    return res.status(200).json({ status: true, data: plans });
  } catch (error) {
    console.error("listPlansAdmin error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// GET /api/subscriptions/plans  (public) — active plans for the app.
exports.listPlansPublic = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    return res.status(200).json({ status: true, data: plans });
  } catch (error) {
    console.error("listPlansPublic error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

/* --------------------------- SUBSCRIPTIONS (purchases) --------------------------- */

// Create a subscription for a user against a plan. Shared by the app-facing
// subscribe endpoint and the admin assign endpoint.
const createSubscriptionFor = async (userId, planId, paymentRef = "") => {
  const [user, plan] = await Promise.all([
    User.findById(userId),
    Plan.findById(planId),
  ]);
  if (!user) throw { code: 404, message: "User not found." };
  if (!plan || !plan.isActive) throw { code: 404, message: "Plan not found or inactive." };

  const start = new Date();
  const sub = await Subscription.create({
    userId,
    planId,
    startDate: start,
    endDate: addDays(start, plan.durationDays),
    status: "active",
    amountPaid: plan.price,
    paymentRef,
  });

  // Best-effort confirmation push.
  sendToUser(String(userId), {
    title: "Subscription active",
    body: `Your ${plan.name} plan is now active.`,
    data: { type: "subscription", subscriptionId: String(sub._id) },
  });

  return sub.populate("planId");
};

// POST /api/subscriptions/subscribe  (app)  { userId, planId, paymentRef? }
exports.subscribe = async (req, res) => {
  try {
    const { userId, planId, paymentRef } = req.body;
    if (!userId || !planId) {
      return res
        .status(400)
        .json({ status: false, message: "userId and planId are required." });
    }
    const sub = await createSubscriptionFor(userId, planId, paymentRef || "");
    return res.status(201).json({ status: true, data: sub });
  } catch (error) {
    if (error && error.code === 404) {
      return res.status(404).json({ status: false, message: error.message });
    }
    console.error("subscribe error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// GET /api/subscriptions/user/:userId  (app) — that user's subscriptions.
exports.getUserSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.params.userId })
      .populate("planId")
      .sort({ createdAt: -1 });
    return res.status(200).json({ status: true, data: subs });
  } catch (error) {
    console.error("getUserSubscriptions error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// POST /api/admin/subscriptions/assign  (admin)  { userId, planId }
exports.assignSubscription = async (req, res) => {
  try {
    const { userId, planId } = req.body;
    if (!userId || !planId) {
      return res
        .status(400)
        .json({ status: false, message: "userId and planId are required." });
    }
    const sub = await createSubscriptionFor(userId, planId, "admin-assigned");
    return res.status(201).json({ status: true, data: sub });
  } catch (error) {
    if (error && error.code === 404) {
      return res.status(404).json({ status: false, message: error.message });
    }
    console.error("assignSubscription error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// GET /api/admin/subscriptions  (admin) — paginated, populated.
exports.listSubscriptions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Subscription.find(filter)
        .populate("planId")
        .populate({ path: "userId", select: "userName email phonenumber" })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Subscription.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("listSubscriptions error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// PUT /api/admin/subscriptions/:id/cancel  (admin)
exports.cancelSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!sub) {
      return res.status(404).json({ status: false, message: "Subscription not found." });
    }
    return res.status(200).json({ status: true, data: sub });
  } catch (error) {
    console.error("cancelSubscription error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

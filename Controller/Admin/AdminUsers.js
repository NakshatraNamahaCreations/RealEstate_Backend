const User = require("../../Model/Auth/User");
const Property = require("../../Model/Sellproperty/Sellproperty");
const Enquiry = require("../../Model/Enquiry/Enquiry");

// Shared pagination/search parser used across admin list endpoints.
const parseListQuery = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const search = (req.query.search || "").trim();
  return { page, limit, skip: (page - 1) * limit, search };
};

// GET /api/admin/users?page&limit&search&status
exports.listUsers = async (req, res) => {
  try {
    const { page, limit, skip, search } = parseListQuery(req);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const or = [{ userName: rx }, { email: rx }];
      if (/^\d+$/.test(search)) or.push({ phonenumber: Number(search) });
      filter.$or = or;
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("listUsers error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// GET /api/admin/users/:id  — user with their listing & enquiry counts.
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found." });
    }

    const [propertyCount, enquiryCount] = await Promise.all([
      Property.countDocuments({ customerId: String(user._id) }),
      Enquiry.countDocuments({ userId: String(user._id) }),
    ]);

    return res
      .status(200)
      .json({ status: true, data: { user, propertyCount, enquiryCount } });
  } catch (error) {
    console.error("getUser error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// PUT /api/admin/users/:id/status  { status: "active" | "blocked" }
exports.setUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "blocked"].includes(status)) {
      return res
        .status(400)
        .json({ status: false, message: "status must be 'active' or 'blocked'." });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found." });
    }
    return res.status(200).json({ status: true, data: user });
  } catch (error) {
    console.error("setUserStatus error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found." });
    }
    // Remove the user's own enquiries (their listings are left intact unless you
    // want a deeper cascade — kept conservative on purpose).
    await Enquiry.deleteMany({ userId: String(user._id) });
    return res.status(200).json({ status: true, message: "User deleted." });
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

module.exports.parseListQuery = parseListQuery;

const User = require("../../Model/Auth/User");
const Property = require("../../Model/Sellproperty/Sellproperty");
const Enquiry = require("../../Model/Enquiry/Enquiry");
const Subscription = require("../../Model/Subscription/Subscription");

// GET /api/admin/dashboard/stats — headline counts + breakdowns for the panel.
exports.getStats = async (req, res) => {
  try {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      blockedUsers,
      newUsers7d,
      totalProperties,
      activeSubs,
      enquiryByStatus,
      propertyByType,
      propertyByApproval,
      recentProperties,
      recentEnquiries,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "blocked" }),
      User.countDocuments({ createdAt: { $gte: since7d } }),
      Property.countDocuments(),
      Subscription.countDocuments({ status: "active", endDate: { $gte: new Date() } }),
      Enquiry.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Property.aggregate([{ $group: { _id: "$propertytype", count: { $sum: 1 } } }]),
      Property.aggregate([{ $group: { _id: "$approvalStatus", count: { $sum: 1 } } }]),
      Property.find().sort({ createdAt: -1 }).limit(5),
      Enquiry.find().sort({ createdAt: -1 }).limit(5),
    ]);

    // Totals that need the breakdowns above.
    const totalEnquiries = enquiryByStatus.reduce((s, r) => s + r.count, 0);
    const newProperties30d = await Property.countDocuments({
      createdAt: { $gte: since30d },
    });

    const toMap = (arr) =>
      arr.reduce((acc, r) => {
        acc[r._id || "unknown"] = r.count;
        return acc;
      }, {});

    return res.status(200).json({
      status: true,
      data: {
        users: { total: totalUsers, blocked: blockedUsers, new7d: newUsers7d },
        properties: {
          total: totalProperties,
          new30d: newProperties30d,
          byType: toMap(propertyByType),
          byApproval: toMap(propertyByApproval),
        },
        enquiries: { total: totalEnquiries, byStatus: toMap(enquiryByStatus) },
        subscriptions: { active: activeSubs },
        recent: { properties: recentProperties, enquiries: recentEnquiries },
      },
    });
  } catch (error) {
    console.error("getStats error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const Enquiry = require("../../Model/Enquiry/Enquiry");
const Property = require("../../Model/Sellproperty/Sellproperty");
const { parseListQuery } = require("./AdminUsers");

// GET /api/admin/enquiries?page&limit&status&search
exports.listEnquiries = async (req, res) => {
  try {
    const { page, limit, skip, search } = parseListQuery(req);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const or = [{ userName: rx }];
      if (/^\d+$/.test(search)) or.push({ phoneNumber: Number(search) });
      filter.$or = or;
    }

    const [items, total] = await Promise.all([
      Enquiry.find(filter)
        .populate({ path: "propertyId", model: Property })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Enquiry.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("listEnquiries error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// DELETE /api/admin/enquiries/:id
exports.deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ status: false, message: "Enquiry not found." });
    }
    return res.status(200).json({ status: true, message: "Enquiry deleted." });
  } catch (error) {
    console.error("deleteEnquiry error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

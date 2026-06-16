const Property = require("../../Model/Sellproperty/Sellproperty");
const { deletePropertyAndRefs } = require("../../Utils/propertyCleanup");
const { parseListQuery } = require("./AdminUsers");

// GET /api/admin/properties
// Filters: ?type=Sell|Rent  &propertytype=PG|Flat|...  &approvalStatus=
//          &featured=true  &isActive=  &city=  &search=  &page= &limit=
// PG and Rental views are just this endpoint with type/propertytype filters.
exports.listProperties = async (req, res) => {
  try {
    const { page, limit, skip, search } = parseListQuery(req);
    const filter = {};

    if (req.query.type) filter.type = req.query.type;
    if (req.query.propertytype) filter.propertytype = req.query.propertytype;
    if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
    if (req.query.city) filter.city = new RegExp(req.query.city, "i");
    if (req.query.featured === "true") filter.featured = true;
    if (req.query.featured === "false") filter.featured = false;
    if (req.query.isActive === "true") filter.isActive = true;
    if (req.query.isActive === "false") filter.isActive = false;

    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { address: rx },
        { landmark: rx },
        { city: rx },
        { customerName: rx },
        { customerNumber: rx },
      ];
    }

    const [items, total] = await Promise.all([
      Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Property.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("listProperties error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// GET /api/admin/properties/:id
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ status: false, message: "Property not found." });
    }
    return res.status(200).json({ status: true, data: property });
  } catch (error) {
    console.error("getProperty error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// PUT /api/admin/properties/:id/approval  { approvalStatus: pending|approved|rejected }
exports.setApprovalStatus = async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({
        status: false,
        message: "approvalStatus must be pending, approved or rejected.",
      });
    }
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { approvalStatus },
      { new: true }
    );
    if (!property) {
      return res.status(404).json({ status: false, message: "Property not found." });
    }
    return res.status(200).json({ status: true, data: property });
  } catch (error) {
    console.error("setApprovalStatus error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// PUT /api/admin/properties/:id/featured  { featured: boolean }
exports.setFeatured = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { featured: !!req.body.featured },
      { new: true }
    );
    if (!property) {
      return res.status(404).json({ status: false, message: "Property not found." });
    }
    return res.status(200).json({ status: true, data: property });
  } catch (error) {
    console.error("setFeatured error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// PUT /api/admin/properties/:id/active  { isActive: boolean }
exports.setActive = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { isActive: !!req.body.isActive },
      { new: true }
    );
    if (!property) {
      return res.status(404).json({ status: false, message: "Property not found." });
    }
    return res.status(200).json({ status: true, data: property });
  } catch (error) {
    console.error("setActive error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// DELETE /api/admin/properties/:id  — admin override (no ownership check),
// cascades to enquiries, favorites and Cloudinary images.
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ status: false, message: "Property not found." });
    }
    const deleted = await deletePropertyAndRefs(property);
    return res
      .status(200)
      .json({ status: true, message: "Property deleted.", deleted });
  } catch (error) {
    console.error("deleteProperty error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

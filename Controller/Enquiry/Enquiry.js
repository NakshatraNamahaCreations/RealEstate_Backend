const Enquiry = require("../../Model/Enquiry/Enquiry");
const Property = require("../../Model/Sellproperty/Sellproperty");
const User = require("../../Model/Auth/User");
const Notification = require("../../Model/Notification/Notification");
const { sendToUser } = require("../../Utils/fcm");

// Short human label for a property, e.g. "Flat in Mysore".
function propertyLabel(p) {
  if (!p) return "your property";
  const kind =
    p.residentialtype || p.commercialtype || p.propertytype || "property";
  return p.city ? `${kind} in ${p.city}` : kind;
}

// test
// Persist a per-user notification (shows in the in-app inbox, user-deletable,
// no auto-expiry) AND push it via FCM. Best-effort: never throws to the caller
// so a notification failure can't break the enquiry action.
async function notifyUser(userId, { title, body, data }) {
  if (!userId) return;
  try {
    await Notification.create({
      audience: "user",
      userId: String(userId),
      title,
      body,
      type: (data && data.type) || "enquiry",
      data,
    });
  } catch (e) {
    console.error("notifyUser persist failed:", e.message);
  }
  try {
    await sendToUser(String(userId), { title, body, data });
  } catch (e) {
    console.error("notifyUser push failed:", e.message);
  }
}

exports.createEnquiry = async (req, res) => {
  try {
    const { userName, phoneNumber, userId, propertyId, message } = req.body;

    if (!userName || !phoneNumber || !userId || !propertyId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Duplicate guard: block a second enquiry while a previous one from the
    // same user for the same property is still open (pending or accepted).
    const existing = await Enquiry.findOne({
      userId,
      propertyId,
      status: { $in: ["pending", "accept"] },
    });
    if (existing) {
      return res.status(409).json({
        message: "You have already enquired about this property.",
        data: existing,
      });
    }

    const newEnquiry = new Enquiry({
      userName,
      phoneNumber,
      userId,
      propertyId,
      message: typeof message === "string" ? message.trim() : "",
    });

    try {
      await newEnquiry.save();
    } catch (saveErr) {
      // Race condition where two requests passed the guard at once: the unique
      // index rejects the second write. Surface it as a friendly conflict.
      if (saveErr.code === 11000) {
        return res.status(409).json({
          message: "You have already enquired about this property.",
        });
      }
      throw saveErr;
    }

    // Notify the property owner about the new enquiry (inbox + push).
    try {
      const property = await Property.findById(propertyId).select(
        "customerId propertytype residentialtype commercialtype city",
      );
      if (property && property.customerId) {
        const label = propertyLabel(property);
        await notifyUser(property.customerId, {
          title: "New enquiry",
          body: newEnquiry.message
            ? `${userName} on your ${label}: ${newEnquiry.message}`
            : `${userName} enquired about your ${label}`,
          data: { type: "new_enquiry", propertyId: String(propertyId) },
        });
      }
    } catch (notifyErr) {
      console.error("Enquiry notification failed:", notifyErr.message);
    }

    res
      .status(200)
      .json({ message: "Enquiry created successfully!", data: newEnquiry });
  } catch (error) {
    console.error("Error creating enquiry:", error);
    res
      .status(500)
      .json({ message: "Failed to create enquiry - " + error.message });
  }
};

exports.getAllEnquiries = async (req, res) => {
  try {
    const allEnquiries = await Enquiry.find();

    if (!allEnquiries.length) {
      return res.status(404).json({ message: "No enquiries found." });
    }

    res.status(200).json({
      message: "All enquiries fetched successfully",
      data: allEnquiries,
    });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch enquiries - " + error.message });
  }
};

exports.getEnquiryByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const enquiry = await Enquiry.find({ userId }).populate({
      path: "propertyId",
      model: Property,
    });

    if (!enquiry) {
      return res
        .status(404)
        .json({ message: "Enquiry not found for the given user." });
    }

    const propertyData = enquiry.propertyId;

    res.status(200).json({
      message: "Enquiry found successfully with property data",
      data: {
        enquiry: enquiry,
        // property: propertyData,
      },
    });
  } catch (error) {
    console.error("Error fetching enquiry by userId:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch enquiry - " + error.message });
  }
};

exports.acceptEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.params;

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      enquiryId,
      { status: "accept" },
      { new: true },
    );

    if (!updatedEnquiry) {
      return res.status(404).json({ message: "Enquiry not found." });
    }

    // Notify the enquirer that their enquiry was accepted (inbox + push).
    const acProp = await Property.findById(updatedEnquiry.propertyId).select(
      "propertytype residentialtype commercialtype city",
    );
    await notifyUser(updatedEnquiry.userId, {
      title: "Enquiry accepted",
      body: `Your enquiry for ${propertyLabel(acProp)} has been accepted.`,
      data: {
        type: "enquiry_status",
        enquiryId: String(updatedEnquiry._id),
        propertyId: String(updatedEnquiry.propertyId),
        status: "accept",
      },
    });

    res.status(200).json({
      message: "Enquiry accepted successfully",
      data: updatedEnquiry,
    });
  } catch (error) {
    console.error("Error accepting enquiry:", error);
    res
      .status(500)
      .json({ message: "Failed to accept enquiry - " + error.message });
  }
};

exports.rejectEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.params;

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      enquiryId,
      { status: "reject" },
      { new: true },
    );

    if (!updatedEnquiry) {
      return res.status(404).json({ message: "Enquiry not found." });
    }

    // Notify the enquirer that their enquiry was declined (inbox + push).
    const rjProp = await Property.findById(updatedEnquiry.propertyId).select(
      "propertytype residentialtype commercialtype city",
    );
    await notifyUser(updatedEnquiry.userId, {
      title: "Enquiry declined",
      body: `Your enquiry for ${propertyLabel(rjProp)} has been declined.`,
      data: {
        type: "enquiry_status",
        enquiryId: String(updatedEnquiry._id),
        propertyId: String(updatedEnquiry.propertyId),
        status: "reject",
      },
    });

    res.status(200).json({
      message: "Enquiry rejected successfully",
      data: updatedEnquiry,
    });
  } catch (error) {
    console.error("Error rejecting enquiry:", error);
    res
      .status(500)
      .json({ message: "Failed to reject enquiry - " + error.message });
  }
};

exports.getAcceptedEnquiries = async (req, res) => {
  try {
    const acceptedEnquiries = await Enquiry.find({ status: "accept" }).populate(
      {
        path: "propertyId",
        model: Property,
      },
    );

    if (!acceptedEnquiries.length) {
      return res.status(404).json({ message: "No accepted enquiries found." });
    }

    res.status(200).json({
      message: "Accepted enquiries fetched successfully",
      data: acceptedEnquiries,
    });
  } catch (error) {
    console.error("Error fetching accepted enquiries:", error);
    res.status(500).json({
      message: "Failed to fetch accepted enquiries - " + error.message,
    });
  }
};

exports.getRejectedEnquiries = async (req, res) => {
  try {
    const rejectedEnquiries = await Enquiry.find({ status: "reject" }).populate(
      {
        path: "propertyId",
        model: Property,
      },
    );

    if (!rejectedEnquiries.length) {
      return res.status(404).json({ message: "No rejected enquiries found." });
    }

    res.status(200).json({
      message: "Rejected enquiries fetched successfully",
      data: rejectedEnquiries,
    });
  } catch (error) {
    console.error("Error fetching rejected enquiries:", error);
    res.status(500).json({
      message: "Failed to fetch rejected enquiries - " + error.message,
    });
  }
};

exports.getallpropertyEnquiries = async (req, res) => {
  try {
    const allEnquiries = await Enquiry.find({}).populate({
      path: "propertyId",
      model: Property,
    });

    if (!allEnquiries.length) {
      return res.status(404).json({ message: "No enquiries found." });
    }

    res.status(200).json({
      message: "All enquiries fetched successfully",
      data: allEnquiries,
    });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    res.status(500).json({
      message: "Failed to fetch enquiries - " + error.message,
    });
  }
};

exports.getEnquiriesByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "customerId is required." });
    }

    // Start from ALL properties this customer owns (newest first) so every
    // listing shows on the dashboard — even ones with zero enquiries.
    const properties = await Property.find({ customerId }).sort({
      createdAt: -1,
    });

    // Pull enquiries for those properties and bucket them by property id.
    const propertyIds = properties.map((p) => p._id);
    const enquiries = await Enquiry.find({
      propertyId: { $in: propertyIds },
    });

    const usersByProperty = new Map();
    for (const e of enquiries) {
      const key = String(e.propertyId);
      if (!usersByProperty.has(key)) usersByProperty.set(key, []);
      usersByProperty.get(key).push({
        enquiryId: String(e._id),
        userId: e.userId,
        userName: e.userName,
        phoneNumber: e.phoneNumber,
        status: e.status,
        message: e.message || "",
      });
    }

    // One { property, users } entry per owned property (users may be empty).
    const data = properties.map((property) => ({
      property,
      users: usersByProperty.get(String(property._id)) || [],
    }));

    res.status(200).json({
      message: "Properties and associated enquiries fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching enquiries by customerId:", error);
    res.status(500).json({
      message: "Failed to fetch enquiries - " + error.message,
    });
  }
};

const Enquiry = require("../../Model/Enquiry/Enquiry");
const Property = require("../../Model/Sellproperty/Sellproperty");
const User = require("../../Model/Auth/User");

exports.createEnquiry = async (req, res) => {
  try {
    const { userName, phoneNumber, userId, propertyId } = req.body;

    if (!userName || !phoneNumber || !userId || !propertyId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newEnquiry = new Enquiry({
      userName,
      phoneNumber,
      userId,
      propertyId,
    });

    await newEnquiry.save();
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
      { accepted: true },
      { new: true }
    );

    if (!updatedEnquiry) {
      return res.status(404).json({ message: "Enquiry not found." });
    }

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
      { accepted: false },
      { new: true }
    );

    if (!updatedEnquiry) {
      return res.status(404).json({ message: "Enquiry not found." });
    }

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
    const acceptedEnquiries = await Enquiry.find({ accepted: true }).populate({
      path: "propertyId",
      model: Property,
    });

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
    const rejectedEnquiries = await Enquiry.find({ accepted: false }).populate({
      path: "propertyId",
      model: Property,
    });

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

// exports.getEnquiryByUserIdAndCustomerId = async (req, res) => {
//   try {
//     const { userId, customerId } = req.params;

//     if (!userId || !customerId) {
//       return res
//         .status(400)
//         .json({ message: "userId and customerId are required." });
//     }

//     const enquiries = await Enquiry.find({ userId }).populate({
//       path: "propertyId",
//       model: Property,
//       match: { customerId: customerId },
//     });

//     const validEnquiries = enquiries.filter(
//       (enquiry) => enquiry.propertyId !== null
//     );

//     if (!validEnquiries.length) {
//       return res.status(404).json({
//         message: "No enquiries found for the given userId and customerId.",
//       });
//     }

//     res.status(200).json({
//       message: "Enquiries and associated properties fetched successfully",
//       data: validEnquiries,
//     });
//   } catch (error) {
//     console.error("Error fetching enquiries by userId and customerId:", error);
//     res.status(500).json({
//       message: "Failed to fetch enquiries - " + error.message,
//     });
//   }
// };

exports.getEnquiriesByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "customerId is required." });
    }

    const enquiries = await Enquiry.find().populate({
      path: "propertyId",
      model: Property,
      match: { customerId: customerId },
    });

    const validEnquiries = enquiries.filter(
      (enquiry) => enquiry.propertyId !== null
    );

    if (!validEnquiries.length) {
      return res.status(404).json({
        message: "No enquiries found for the given customerId.",
      });
    }

    res.status(200).json({
      message: "Enquiries and associated properties fetched successfully",
      data: validEnquiries,
    });
  } catch (error) {
    console.error("Error fetching enquiries by customerId:", error);
    res.status(500).json({
      message: "Failed to fetch enquiries - " + error.message,
    });
  }
};

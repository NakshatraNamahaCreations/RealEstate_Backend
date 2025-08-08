const mongoose = require("mongoose");

const EnquirySchema = new mongoose.Schema({
  userName: { type: String, required: true },
  phoneNumber: { type: Number, required: true },
  userId: { type: String, required: true },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sellproperty",
    required: true,
  },
  accepted: { type: Boolean, default: false },
});

const Enquiry = mongoose.model("Enquiry", EnquirySchema);
module.exports = Enquiry;

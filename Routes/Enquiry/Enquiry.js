const express = require("express");
const router = express.Router();
const enquiryController = require("../../Controller/Enquiry/Enquiry");

router.post("/enquiries", enquiryController.createEnquiry);

router.get("/enquiries", enquiryController.getAllEnquiries);

router.get("/enquiries/:userId", enquiryController.getEnquiryByUserId);

router.put("/enquiries/accept/:enquiryId", enquiryController.acceptEnquiry);

router.put("/enquiries/reject/:enquiryId", enquiryController.rejectEnquiry);

router.get("/accepted", enquiryController.getAcceptedEnquiries);

router.get("/rejected", enquiryController.getRejectedEnquiries);

router.get("/getallenquiries", enquiryController.getallpropertyEnquiries);

router.get(
  "/enquiries/customer/:customerId",
  enquiryController.getEnquiriesByCustomerId
);

module.exports = router;

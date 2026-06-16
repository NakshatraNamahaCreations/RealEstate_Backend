const { Router } = require("express");
const router = Router();
const PaymentController = require("../../Controller/Payment/Payment");

// JSON routes (the webhook is mounted separately in index.js with a raw body
// parser, since signature verification needs the unparsed payload).
router.post("/order", PaymentController.createOrder);
router.post("/verify", PaymentController.verifyPayment);

module.exports = router;

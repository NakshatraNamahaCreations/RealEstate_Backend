const { Router } = require("express");
const router = Router();
const Subscription = require("../../Controller/Subscription/Subscription");

// App-facing subscription endpoints (no admin auth).
router.get("/plans", Subscription.listPlansPublic);
router.post("/subscribe", Subscription.subscribe);
router.get("/user/:userId", Subscription.getUserSubscriptions);

module.exports = router;

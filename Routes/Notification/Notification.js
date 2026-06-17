const { Router } = require("express");
const router = Router();
const NotificationController = require("../../Controller/Notification/Notification");

// App-facing inbox endpoints (userId in the request, consistent with the
// rest of the app's unauthenticated user APIs).
router.get("/:userId", NotificationController.getForUser);
router.delete("/:id", NotificationController.deleteForUser);

module.exports = router;

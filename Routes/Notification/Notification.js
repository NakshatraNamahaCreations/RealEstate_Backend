const { Router } = require("express");
const router = Router();
const NotificationController = require("../../Controller/Notification/Notification");

// Printed once at startup. If this line (with delete-many) is missing from
// the server log, the server is still running old code — redeploy + restart.
console.log(
  "[notifications] routes loaded: GET /:userId, POST /delete-many, DELETE /:id"
);

// Log every inbox request so delete problems are visible in the server log.
router.use((req, res, next) => {
  const started = Date.now();
  console.log(
    `[notifications] -> ${req.method} ${req.originalUrl}`,
    req.method === "GET" ? "" : JSON.stringify(req.body || {})
  );
  res.on("finish", () => {
    console.log(
      `[notifications] <- ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - started}ms)`
    );
  });
  next();
});

// App-facing inbox endpoints (userId in the request, consistent with the
// rest of the app's unauthenticated user APIs).
router.get("/:userId", NotificationController.getForUser);
router.post("/delete-many", NotificationController.deleteManyForUser);
router.delete("/:id", NotificationController.deleteForUser);

module.exports = router;

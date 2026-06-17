const mongoose = require("mongoose");

// A stored notification for the in-app inbox.
//   audience "all"  -> one shared broadcast doc; expiresAt set (auto-deletes
//                      after 15 days via the TTL index). Not user-deletable.
//   audience "user" -> one doc per targeted user; NO expiresAt, so it persists
//                      until the user deletes it.
const NotificationSchema = new mongoose.Schema(
  {
    audience: { type: String, enum: ["all", "user"], required: true },
    userId: { type: String, index: true }, // set for targeted notifications
    title: { type: String, required: true },
    body: { type: String, default: "" },
    type: { type: String, default: "admin" },
    data: { type: mongoose.Schema.Types.Mixed },
    // Only set on broadcasts. Mongo's TTL monitor ignores docs where the field
    // is missing/null, so targeted notifications never auto-expire.
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;

const Notification = require("../../Model/Notification/Notification");

class NotificationController {
  // App inbox: targeted-for-me + all live broadcasts, newest first.
  async getForUser(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res
          .status(400)
          .json({ status: false, message: "userId is required." });
      }

      const items = await Notification.find({
        $or: [{ audience: "user", userId }, { audience: "all" }],
      }).sort({ createdAt: -1 });

      return res.status(200).json({ status: true, data: items });
    } catch (error) {
      console.error("getForUser error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Failed to load notifications." });
    }
  }

  // Delete a targeted notification the user owns. Broadcasts are shared and
  // auto-expire, so they are not per-user deletable.
  async deleteForUser(req, res) {
    try {
      const { id } = req.params;
      const userId = (req.body && req.body.userId) || req.query.userId;
      if (!userId) {
        return res
          .status(400)
          .json({ status: false, message: "userId is required." });
      }

      const result = await Notification.deleteOne({
        _id: id,
        audience: "user",
        userId,
      });

      if (result.deletedCount === 0) {
        return res.status(403).json({
          status: false,
          message: "This notification can't be deleted.",
        });
      }

      return res.status(200).json({ status: true, message: "Deleted." });
    } catch (error) {
      console.error("deleteForUser error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Failed to delete notification." });
    }
  }
}

module.exports = new NotificationController();

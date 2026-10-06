const mongoose = require("mongoose");
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
        $or: [
          { audience: "user", userId },
          { audience: "all", hiddenFor: { $ne: userId } },
        ],
      })
        .select("-hiddenFor")
        .sort({ createdAt: -1 });

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
        // Explain the miss: not found, a broadcast, or owned by someone else.
        const doc = mongoose.isValidObjectId(id)
          ? await Notification.findById(id).select("audience userId").lean()
          : null;
        console.warn("[notifications] deleteForUser: nothing deleted", {
          id,
          userId,
          found: !!doc,
          audience: doc && doc.audience,
          ownerUserId: doc && doc.userId,
        });
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

  // Bulk delete from the user's inbox: body { userId, ids: [...] }.
  // Targeted notifications they own are deleted; broadcasts are hidden for
  // this user only (the shared doc stays for everyone else).
  async deleteManyForUser(req, res) {
    try {
      const { userId, ids } = req.body || {};
      if (!userId || !Array.isArray(ids) || ids.length === 0) {
        console.warn("[notifications] deleteMany: bad request body", req.body);
        return res
          .status(400)
          .json({ status: false, message: "userId and ids are required." });
      }
      const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
      if (validIds.length !== ids.length) {
        console.warn("[notifications] deleteMany: invalid ids skipped",
          ids.filter((id) => !validIds.includes(id)));
      }

      const [deleted, hidden] = await Promise.all([
        Notification.deleteMany({
          _id: { $in: validIds },
          audience: "user",
          userId,
        }),
        Notification.updateMany(
          { _id: { $in: validIds }, audience: "all" },
          { $addToSet: { hiddenFor: userId } }
        ),
      ]);

      const count = deleted.deletedCount + hidden.modifiedCount;
      console.log("[notifications] deleteMany result", {
        userId,
        requested: ids.length,
        deletedTargeted: deleted.deletedCount,
        hiddenBroadcasts: hidden.modifiedCount,
      });
      if (count < validIds.length) {
        // Some ids matched nothing for this user — log what they actually are.
        const docs = await Notification.find({ _id: { $in: validIds } })
          .select("audience userId hiddenFor")
          .lean();
        console.warn("[notifications] deleteMany: some ids not removed", {
          notFound: validIds.filter(
            (id) => !docs.some((d) => String(d._id) === String(id))
          ),
          remaining: docs.map((d) => ({
            id: String(d._id),
            audience: d.audience,
            ownerUserId: d.userId,
            alreadyHidden: (d.hiddenFor || []).includes(userId),
          })),
        });
      }

      return res.status(200).json({
        status: true,
        message: "Deleted.",
        count,
      });
    } catch (error) {
      console.error("deleteManyForUser error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Failed to delete notifications." });
    }
  }
}

module.exports = new NotificationController();

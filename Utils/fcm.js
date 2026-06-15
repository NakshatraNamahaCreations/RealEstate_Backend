// FCM delivery helpers.
//
// Every function is defensive: a push failure must never break the API call
// that triggered it (creating an enquiry, accepting it, etc.). All data values
// are stringified — FCM `data` payloads must be string->string maps.

const { getMessagingOrNull } = require("./firebase");
const User = require("../Model/Auth/User");

const stringifyData = (data = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null) out[k] = String(v);
  }
  return out;
};

// Send a notification to every device registered to a user. Prunes tokens the
// FCM service reports as no longer valid.
const sendToUser = async (userId, { title, body, data } = {}) => {
  try {
    const messaging = getMessagingOrNull();
    if (!messaging || !userId) return;

    const user = await User.findById(userId).select("fcmTokens");
    const tokens = (user && user.fcmTokens) || [];
    if (!tokens.length) return;

    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: stringifyData(data),
    });

    // Collect tokens that are no longer registered so we can drop them.
    const stale = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error && r.error.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token" ||
          code === "messaging/invalid-argument"
        ) {
          stale.push(tokens[i]);
        }
      }
    });

    if (stale.length) {
      await User.updateOne(
        { _id: userId },
        { $pull: { fcmTokens: { $in: stale } } }
      );
    }
  } catch (err) {
    console.error("sendToUser failed:", err.message);
  }
};

// Broadcast to all devices subscribed to a topic (e.g. "all").
const sendToTopic = async (topic, { title, body, data } = {}) => {
  try {
    const messaging = getMessagingOrNull();
    if (!messaging || !topic) return;

    await messaging.send({
      topic,
      notification: { title, body },
      data: stringifyData(data),
    });
  } catch (err) {
    console.error("sendToTopic failed:", err.message);
  }
};

module.exports = { sendToUser, sendToTopic };

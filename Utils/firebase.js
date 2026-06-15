// Firebase Admin SDK initialization.
//
// Loads a service-account JSON whose path comes from FIREBASE_SERVICE_ACCOUNT
// (default ./serviceAccountKey.json). Drop that file in the backend root; it is
// git-ignored. Initialized once and reused across the process.

const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

let messaging = null;

const serviceAccountPath = path.resolve(
  process.env.FIREBASE_SERVICE_ACCOUNT || "./serviceAccountKey.json"
);

try {
  if (!getApps().length) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const serviceAccount = require(serviceAccountPath);
    initializeApp({ credential: cert(serviceAccount) });
  }
  messaging = getMessaging();
  console.log("✅ Firebase Admin initialized");
} catch (err) {
  // Don't crash the server if the credentials are missing — push features will
  // simply no-op and log, while the rest of the API keeps working.
  console.error(
    "⚠️  Firebase Admin not initialized (push notifications disabled):",
    err.message
  );
}

// Returns the messaging instance, or null if Firebase failed to initialize.
const getMessagingOrNull = () => messaging;

module.exports = { getMessagingOrNull };

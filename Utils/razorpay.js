// Razorpay client + signature helpers.
//
// Keys come from the environment (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).
// We create orders and verify signatures server-side so the client can never
// fake a successful payment.

const crypto = require("crypto");
const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpay = null;
if (keyId && keySecret) {
  razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
} else {
  console.error("⚠️  Razorpay keys missing — payments disabled.");
}

// Verifies the checkout signature returned to the client:
//   HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET) === signature
const verifyPaymentSignature = ({ order_id, payment_id, signature }) => {
  if (!keySecret || !order_id || !payment_id || !signature) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${order_id}|${payment_id}`)
    .digest("hex");
  // Constant-time compare.
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Verifies a webhook payload signature against the raw request body.
const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
  razorpay,
  keyId,
  verifyPaymentSignature,
  verifyWebhookSignature,
};

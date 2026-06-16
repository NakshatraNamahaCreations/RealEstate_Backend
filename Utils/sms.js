// bulksmsplans.com SMS sender.
//
// We generate and verify OTPs ourselves (see Controller/Auth/Otp.js); this
// module is only the delivery channel.
//
// API: GET https://www.bulksmsplans.com/api/send_sms
//   Required: api_id, api_password (the API validates credentials first).
//   Standard params: sms_type, sms_encoding, sender, number, message, template_id
//   Response JSON: { "code": <int>, "message": <text>, ... }  (code 200 = sent;
//   e.g. 500 / "Access Denied!" on bad credentials).
//
// IMPORTANT (India DLT): `message` must match your DLT-approved template text
// exactly, with the OTP substituted in. Configure SMS_OTP_MESSAGE to that text
// using `{otp}` as the placeholder, and SMS_TEMPLATE_ID to the template id.

const SMS_ENDPOINT = "https://www.bulksmsplans.com/api/send_sms";

const DEFAULT_MESSAGE = "Your OTP for 30Forty is {otp}";

// Normalise a 10-digit Indian number to the API's expected `91XXXXXXXXXX`.
const toApiNumber = (phonenumber) => {
  const digits = String(phonenumber).replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits; // already includes a country code
};

const sendOtpSms = async (phonenumber, otp) => {
  const message = (process.env.SMS_OTP_MESSAGE || DEFAULT_MESSAGE).replace(
    /\{otp\}/g,
    String(otp)
  );

  const params = new URLSearchParams({
    api_id: process.env.SMS_API_ID || "",
    api_password: process.env.SMS_API_PASSWORD || "",
    sms_type: process.env.SMS_TYPE || "T",
    sms_encoding: process.env.SMS_ENCODING || "1",
    sender: process.env.SMS_SENDER_ID || "",
    number: toApiNumber(phonenumber),
    message,
    template_id: process.env.SMS_TEMPLATE_ID || "",
  });

  const url = `${SMS_ENDPOINT}?${params.toString()}`;

  // Verbose, secret-masked log of exactly what we send to the provider.
  console.log("========== [SMS] REQUEST ==========");
  console.log("[SMS] endpoint  :", SMS_ENDPOINT);
  console.log("[SMS] number    :", toApiNumber(phonenumber));
  console.log("[SMS] sender    :", process.env.SMS_SENDER_ID || "(missing)");
  console.log("[SMS] template  :", process.env.SMS_TEMPLATE_ID || "(missing)");
  console.log("[SMS] sms_type  :", process.env.SMS_TYPE || "T");
  console.log("[SMS] encoding  :", process.env.SMS_ENCODING || "1");
  console.log("[SMS] message   :", message);
  console.log("[SMS] api_id    :", process.env.SMS_API_ID ? "set" : "(missing)");
  console.log("[SMS] api_pass  :", process.env.SMS_API_PASSWORD ? "set" : "(missing)");
  console.log("===================================");

  let res;
  try {
    res = await fetch(url, { method: "GET" });
  } catch (err) {
    console.error("[SMS] network error:", err.message);
    throw new Error("Failed to reach SMS provider");
  }

  const raw = await res.text();
  // Always log the raw provider response — this is the key to diagnosing a
  // "submitted but not delivered" case (DLT template/sender mismatch, balance,
  // etc.). The HTTP status here is the provider's HTTP layer, not delivery.
  console.log("[SMS] http status:", res.status);
  console.log("[SMS] raw response:", raw);

  let body;
  try {
    body = JSON.parse(raw);
  } catch (_) {
    console.error("[SMS] non-JSON response (see raw above)");
    throw new Error("Unexpected SMS provider response");
  }

  // Success is signalled by code 200 (some accounts return 201). Anything else
  // (e.g. 500 "Access Denied!") is a failure.
  if (Number(body.code) !== 200 && Number(body.code) !== 201) {
    console.error("[SMS] provider rejected message:", body);
    throw new Error(body.message || "SMS provider rejected the message");
  }

  console.log("[SMS] accepted by provider:", JSON.stringify(body));
  return body;
};

module.exports = { sendOtpSms };

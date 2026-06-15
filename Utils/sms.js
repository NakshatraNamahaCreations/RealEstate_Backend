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

  let res;
  try {
    res = await fetch(url, { method: "GET" });
  } catch (err) {
    console.error("SMS request failed (network):", err.message);
    throw new Error("Failed to reach SMS provider");
  }

  const raw = await res.text();
  let body;
  try {
    body = JSON.parse(raw);
  } catch (_) {
    console.error("SMS provider returned non-JSON:", res.status, raw.slice(0, 200));
    throw new Error("Unexpected SMS provider response");
  }

  // Success is signalled by code 200 (some accounts return 201). Anything else
  // (e.g. 500 "Access Denied!") is a failure.
  if (Number(body.code) !== 200 && Number(body.code) !== 201) {
    console.error("SMS provider rejected message:", body);
    throw new Error(body.message || "SMS provider rejected the message");
  }

  return body;
};

module.exports = { sendOtpSms };

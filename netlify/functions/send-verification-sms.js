// netlify/functions/send-verification-sms.js
// Sends SMS verification codes using Twilio

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

// Clean phone number - remove all non-digits
function cleanPhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length < 10 || cleaned.length > 15) return null;
  return cleaned;
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const {
      phone,
      first_name,
      code,
    } = JSON.parse(event.body || "{}");

    if (!phone || !code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields",
          details: "Required: phone, code",
        }),
      };
    }

    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("Twilio env vars missing");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "SMS service not configured" }),
      };
    }

    const cleanPhone = cleanPhoneNumber(phone);
    if (!cleanPhone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid phone number format" }),
      };
    }

    // Simple verification SMS
    const messageBody = `CanadaMade: Your code is ${code}. Expires in 10 min.`;

    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const formData = new URLSearchParams({
      To: `+${cleanPhone}`,
      From: TWILIO_PHONE_NUMBER,
      Body: messageBody,
    });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twilio error:", response.status, errorText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Failed to send SMS",
          status: response.status,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("send-verification-sms error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", message: error.message }),
    };
  }
};

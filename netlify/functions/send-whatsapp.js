// netlify/functions/send-whatsapp.js
// Sends WhatsApp verification messages via sev7enmarketing.com API

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
      phone,           // recipient phone number (with country code)
      code,            // verification code
      first_name,      // recipient first name
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

    // Get environment variables
    const WHATSAPP_API_BASE_URL = process.env.WHATSAPP_API_BASE_URL;
    const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
    const WHATSAPP_VENDOR_UID = process.env.WHATSAPP_VENDOR_UID;
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!WHATSAPP_API_BASE_URL || !WHATSAPP_API_TOKEN || !WHATSAPP_VENDOR_UID || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error("WhatsApp env vars missing");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "WhatsApp service not configured" }),
      };
    }

    // Clean phone number
    const cleanPhone = cleanPhoneNumber(phone);
    if (!cleanPhone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Invalid phone number format",
          details: "Phone number must be 10-15 digits with country code",
        }),
      };
    }

    // Build API URL
    const apiUrl = `${WHATSAPP_API_BASE_URL.replace(/\/$/, '')}/${WHATSAPP_VENDOR_UID}/contact/send-message?token=${WHATSAPP_API_TOKEN}`;

    // Build message body
    const firstName = first_name || "Valued Customer";
    const messageBody = `🍁 *CanadaMade*

Hi ${firstName}!

Your verification code is: *${code}*

Enter this code to verify.
Expires in 10 minutes.`;

    // Build payload for WhatsApp API
    const payload = {
      from_phone_number_id: WHATSAPP_PHONE_NUMBER_ID,
      phone_number: cleanPhone,
      message_body: messageBody,
      contact: {
        first_name: firstName,
        language_code: "en"
      }
    };

    console.log("Sending WhatsApp to:", cleanPhone);

    // Send WhatsApp message
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "CanadaMade-Expo/1.0"
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WhatsApp API error:", response.status, errorText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Failed to send WhatsApp message",
          status: response.status,
          details: errorText,
        }),
      };
    }

    const result = await response.json();
    console.log("WhatsApp sent successfully:", result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message_id: result.message_id, api_response: result, phone_sent_to: cleanPhone }),
    };
  } catch (error) {
    console.error("send-whatsapp error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", message: error.message }),
    };
  }
};

// netlify/functions/send-sms.js
// Sends customer confirmation SMS using Supabase template + Twilio

const { createClient } = require("@supabase/supabase-js");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

// Helper to fill {{placeholders}} in template strings
function applyTemplate(str, vars) {
  if (!str) return "";
  return Object.entries(vars).reduce((acc, [key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    return acc.replace(regex, value ?? "");
  }, str);
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
      phone, // recipient phone number
      first_name, // recipient first name
      flavor, // selected flavor
    } = JSON.parse(event.body || "{}");

    if (!phone || !first_name || !flavor) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields",
          details: "Required: phone, first_name, flavor",
        }),
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase env vars missing");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Supabase configuration error" }),
      };
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("Twilio env vars missing");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "SMS service not configured" }),
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the SMS template from message_templates
    const { data: template, error: templateError } = await supabase
      .from("message_templates")
      .select("body")
      .eq("name", "customer_confirmation_sms")
      .eq("active", true)
      .maybeSingle();

    if (templateError) {
      console.error("Template fetch error:", templateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to load SMS template" }),
      };
    }

    if (!template) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "SMS template not found" }),
      };
    }

    const vars = { first_name, flavor };
    const bodyText = applyTemplate(template.body, vars);

    // Build Twilio API request
    // Twilio uses Basic Auth with AccountSid:AuthToken
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    
    // Twilio API endpoint
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    // Twilio requires form-encoded data
    const formData = new URLSearchParams({
      To: phone,
      From: TWILIO_PHONE_NUMBER,
      Body: bodyText,
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
          details: errorText,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("send-sms error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", message: error.message }),
    };
  }
};



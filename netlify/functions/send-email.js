// netlify/functions/send-email.js
// Sends customer confirmation email using Supabase template + SendGrid

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
      email, // recipient email
      first_name, // recipient first name
      flavor, // selected flavor
    } = JSON.parse(event.body || "{}");

    if (!email || !first_name || !flavor) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields",
          details: "Required: email, first_name, flavor",
        }),
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase env vars missing");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Supabase configuration error" }),
      };
    }

    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY missing");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Email service not configured" }),
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the email template from message_templates
    const { data: template, error: templateError } = await supabase
      .from("message_templates")
      .select("subject, body")
      .eq("name", "customer_confirmation_email")
      .eq("active", true)
      .maybeSingle();

    if (templateError) {
      console.error("Template fetch error:", templateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to load email template" }),
      };
    }

    if (!template) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Email template not found" }),
      };
    }

    const vars = { first_name, flavor };
    const subject = applyTemplate(
      template.subject || "Your CanadaMade sample is ready",
      vars
    );
    const bodyText = applyTemplate(template.body, vars);

    // Build SendGrid payload
    const payload = {
      personalizations: [
        {
          to: [{ email, name: first_name }],
        },
      ],
      from: {
        email: "info@canadamade.com",
        name: "CanadaMade",
      },
      subject,
      content: [
        {
          type: "text/plain",
          value: bodyText,
        },
      ],
    };

    // SendGrid API endpoint
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid error:", response.status, errorText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Failed to send email",
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
    console.error("send-email error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", message: error.message }),
    };
  }
};

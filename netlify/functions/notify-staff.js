// netlify/functions/notify-staff.js
// Prepares staff notification message using Supabase template
// Delivery method (SMS/Email/etc.) will be configured later

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
    // Accept full customer data
    const {
      first_name,
      last_name,
      company,
      job_title,
      phone,
      email,
      country,
      flavor,
      photo_url,
      timestamp,
    } = JSON.parse(event.body || "{}");

    // Validate required fields
    if (!first_name || !last_name || !flavor) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields",
          details: "Required: first_name, last_name, flavor",
        }),
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase env vars missing");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Supabase configuration error" }),
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the staff notification template from message_templates
    const { data: template, error: templateError } = await supabase
      .from("message_templates")
      .select("body")
      .eq("name", "staff_notification")
      .eq("active", true)
      .maybeSingle();

    if (templateError) {
      console.error("Template fetch error:", templateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Failed to load staff notification template",
        }),
      };
    }

    if (!template) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Staff notification template not found",
        }),
      };
    }

    // Prepare variables for template replacement
    const vars = {
      first_name: first_name || "",
      last_name: last_name || "",
      company: company || "",
      job_title: job_title || "",
      phone: phone || "",
      email: email || "",
      country: country || "",
      flavor: flavor || "",
      photo_url: photo_url || "",
      timestamp: timestamp || new Date().toISOString(),
    };

    // Apply template variables
    const messageBody = applyTemplate(template.body, vars);

    // Return the prepared message (delivery method will be added later)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: messageBody,
        // Include prepared data for future delivery implementation
        prepared: {
          body: messageBody,
          variables: vars,
        },
      }),
    };
  } catch (error) {
    console.error("notify-staff error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", message: error.message }),
    };
  }
};

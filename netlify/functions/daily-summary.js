// netlify/functions/daily-summary.js
// Returns daily sample distribution summary

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const SUPABASE_URL = "https://iaabsenvpwyqakvkypeq.supabase.co";
    const SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYWJzZW52cHd5cWFrdmt5cGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTMyODgsImV4cCI6MjA4MzE4OTI4OH0.85jOMUvGfzY5RjHeU9UHrY_89Y2clqzM_rEMGuHLBCY";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get date from query params or use today (Dubai timezone)
    const queryDate = event.queryStringParameters?.date;
    let targetDate = queryDate;

    if (!targetDate) {
      // Calculate Dubai date (UTC+4)
      const now = new Date();
      const dubaiOffset = 4 * 60;
      const localOffset = now.getTimezoneOffset();
      const dubaiTime = new Date(
        now.getTime() + (localOffset + dubaiOffset) * 60000
      );
      targetDate = dubaiTime.toISOString().split("T")[0];
    }

    // Get inventory for the date
    const { data: inventory, error: invError } = await supabase
      .from("inventory")
      .select("flavor, total, remaining")
      .eq("date", targetDate);

    if (invError) {
      throw invError;
    }

    // Get lead count for the date
    const { data: leads, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, flavor, created_at")
      .gte("created_at", `${targetDate}T00:00:00`)
      .lt("created_at", `${targetDate}T23:59:59`);

    if (leadError) {
      throw leadError;
    }

    // Build summary
    const summary = {
      date: targetDate,
      total_leads: leads?.length || 0,
      flavors: (inventory || []).map((item) => ({
        name: item.flavor,
        distributed: item.total - item.remaining,
        remaining: item.remaining,
        total: item.total,
        percentage_used: Math.round(
          ((item.total - item.remaining) / item.total) * 100
        ),
      })),
      total_samples_distributed: (inventory || []).reduce(
        (sum, item) => sum + (item.total - item.remaining),
        0
      ),
      total_samples_remaining: (inventory || []).reduce(
        (sum, item) => sum + item.remaining,
        0
      ),
    };

    // Format for WhatsApp message
    const whatsappMessage = formatWhatsAppSummary(summary);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        summary,
        whatsapp_message: whatsappMessage,
      }),
    };
  } catch (error) {
    console.error("Summary error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", message: error.message }),
    };
  }
};

function formatWhatsAppSummary(summary) {
  let msg = `📊 *DAILY SUMMARY - ${summary.date}*\n\n`;
  msg += `👥 Total Leads: ${summary.total_leads}\n`;
  msg += `🥔 Samples Distributed: ${summary.total_samples_distributed}\n`;
  msg += `📦 Samples Remaining: ${summary.total_samples_remaining}\n\n`;
  msg += `*By Flavor:*\n`;

  summary.flavors.forEach((f) => {
    const bar = getProgressBar(f.percentage_used);
    msg += `\n${f.name}\n`;
    msg += `${bar} ${f.percentage_used}%\n`;
    msg += `Distributed: ${f.distributed} | Left: ${f.remaining}\n`;
  });

  msg += `\n🍁 CanadaMade Gulf Expo 2026`;
  return msg;
}

function getProgressBar(percentage) {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  return "▓".repeat(filled) + "░".repeat(empty);
}

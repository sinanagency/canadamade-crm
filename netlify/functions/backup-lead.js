// netlify/functions/backup-lead.js
// Sends complete lead data to info@canadamade.com as backup

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

exports.handler = async (event, context) => {
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
    const leadData = JSON.parse(event.body || "{}");

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY missing for backup");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Backup email not configured" }),
      };
    }

    const timestamp = new Date().toISOString();
    const dateFormatted = new Date().toLocaleString('en-AE', {
      timeZone: 'Asia/Dubai',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    // Create formatted lead summary
    const leadSummary = `
═══════════════════════════════════════════════════════════════
                    NEW LEAD - GULF EXPO 2026
═══════════════════════════════════════════════════════════════

📅 Submitted: ${dateFormatted}
🆔 Verification Code: ${leadData.verification_code || 'N/A'}

───────────────────────────────────────────────────────────────
                      CONTACT DETAILS
───────────────────────────────────────────────────────────────

👤 Name: ${leadData.first_name || ''} ${leadData.last_name || ''}
🏢 Company: ${leadData.company || 'N/A'}
💼 Job Title: ${leadData.job_title || 'N/A'}

📧 Email: ${leadData.email || 'N/A'}
📱 Phone: ${leadData.phone || 'N/A'}
📱 Phone 2: ${leadData.phone2 || 'N/A'}
💬 WhatsApp: ${leadData.whatsapp_number || 'Same as phone'}

🌍 Country: ${leadData.country || 'N/A'}

───────────────────────────────────────────────────────────────
                      PREFERENCES
───────────────────────────────────────────────────────────────

📞 Communication: ${leadData.comm_preference?.toUpperCase() || 'N/A'}
🍟 Flavor Selected: ${leadData.flavor || 'N/A'}
🏪 Interest/Distribution: ${leadData.interest || 'N/A'}

───────────────────────────────────────────────────────────────
                      VERIFICATION STATUS
───────────────────────────────────────────────────────────────

✅ Verified: ${leadData.verified ? 'YES' : 'NO'}
⏰ Verified At: ${leadData._extraData?.verified_at || timestamp}
📲 Verification Method: ${leadData._extraData?.verification_method || leadData.comm_preference || 'N/A'}
📦 Collected Sample: ${leadData._extraData?.collected ? 'YES' : 'NO - PENDING'}

───────────────────────────────────────────────────────────────
                      ADDITIONAL NOTES
───────────────────────────────────────────────────────────────

${leadData.notes || 'No additional notes'}

───────────────────────────────────────────────────────────────
                      BUSINESS CARD DATA
───────────────────────────────────────────────────────────────

OCR Status: ${leadData.ocr_status || 'none'}
Photo URL: ${leadData.photo_url || 'No photo'}

OCR Raw Text:
${leadData.ocr_raw || 'No OCR data'}

═══════════════════════════════════════════════════════════════
                    RAW JSON DATA (BACKUP)
═══════════════════════════════════════════════════════════════

${JSON.stringify(leadData, null, 2)}

═══════════════════════════════════════════════════════════════
`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #e31837 0%, #b91c1c 100%); color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .section { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 14px; }
    .value { color: #1a1a1a; font-weight: 500; font-size: 14px; text-align: right; }
    .highlight { background: #fef2f2; padding: 16px; border-radius: 8px; text-align: center; margin: 12px 0; }
    .highlight .flavor { font-size: 24px; font-weight: 700; color: #e31837; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status.verified { background: #d1fae5; color: #065f46; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .footer { background: #1a1a1a; color: white; padding: 16px 24px; text-align: center; font-size: 12px; }
    .raw-data { background: #f9fafb; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍁 New Lead Captured</h1>
      <p>Gulf Expo Dubai 2026 - ${dateFormatted}</p>
    </div>

    <div class="section">
      <div class="section-title">Contact Information</div>
      <div class="row"><span class="label">Name</span><span class="value">${leadData.first_name || ''} ${leadData.last_name || ''}</span></div>
      <div class="row"><span class="label">Company</span><span class="value">${leadData.company || 'N/A'}</span></div>
      <div class="row"><span class="label">Job Title</span><span class="value">${leadData.job_title || 'N/A'}</span></div>
      <div class="row"><span class="label">Email</span><span class="value">${leadData.email || 'N/A'}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value">${leadData.phone || 'N/A'}</span></div>
      <div class="row"><span class="label">WhatsApp</span><span class="value">${leadData.whatsapp_number || 'Same as phone'}</span></div>
      <div class="row"><span class="label">Country</span><span class="value">${leadData.country || 'N/A'}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Flavor Selected</div>
      <div class="highlight">
        <div class="flavor">🍟 ${leadData.flavor || 'Not selected'}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Verification Status</div>
      <div class="row">
        <span class="label">Status</span>
        <span class="status ${leadData.verified ? 'verified' : 'pending'}">${leadData.verified ? '✅ Verified' : '⏳ Pending'}</span>
      </div>
      <div class="row"><span class="label">Code</span><span class="value">${leadData.verification_code || 'N/A'}</span></div>
      <div class="row"><span class="label">Method</span><span class="value">${leadData.comm_preference?.toUpperCase() || 'N/A'}</span></div>
      <div class="row"><span class="label">Collected</span><span class="value">${leadData._extraData?.collected ? '✅ Yes' : '❌ Not yet'}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Notes</div>
      <p style="color: #4b5563; font-size: 14px; margin: 0;">${leadData.notes || 'No additional notes provided'}</p>
    </div>

    <div class="section">
      <div class="section-title">Raw Data (Backup)</div>
      <div class="raw-data">${JSON.stringify(leadData, null, 2)}</div>
    </div>

    <div class="footer">
      <p style="margin: 0;">🍁 CanadaMade Lead Backup System</p>
      <p style="margin: 4px 0 0; opacity: 0.7;">Timestamp: ${timestamp}</p>
    </div>
  </div>
</body>
</html>
`;

    // Send backup email to info@canadamade.com
    const payload = {
      personalizations: [{
        to: [{ email: "info@canadamade.com", name: "CanadaMade Leads" }],
      }],
      from: { email: "info@canadamade.com", name: "CanadaMade Lead System" },
      subject: `🍁 New Lead: ${leadData.first_name || 'Unknown'} ${leadData.last_name || ''} - ${leadData.company || 'Gulf Expo'} [${leadData.flavor || 'No flavor'}]`,
      content: [
        { type: "text/plain", value: leadSummary },
        { type: "text/html", value: htmlBody },
      ],
    };

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
      console.error("Backup email error:", errorText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Failed to send backup email", details: errorText }),
      };
    }

    console.log("Lead backup sent to info@canadamade.com:", leadData.email);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, backed_up_to: "info@canadamade.com" }),
    };

  } catch (error) {
    console.error("backup-lead error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", message: error.message }),
    };
  }
};

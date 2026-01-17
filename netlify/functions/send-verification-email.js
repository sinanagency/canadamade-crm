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
    const { email, code, first_name } = JSON.parse(event.body || "{}");

    if (!email || !code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields",
          details: "Required: email, code",
        }),
      };
    }

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY missing");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Email service not configured" }),
      };
    }

    const firstName = first_name || "there";

    // Clean, simple subject without emojis (less spam-like)
    const subject = "Your verification code from CanadaMade";

    // Simple, clean HTML email that works well even without images
    const bodyHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px;">

          <!-- Logo/Brand -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <span style="font-size: 32px;">🍁</span>
              <h1 style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">CanadaMade</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #666666;">Gulf Expo Dubai 2026</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi ${firstName},
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 0 24px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Here's your verification code:
              </p>
            </td>
          </tr>

          <!-- Code Box -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px 40px;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #E31837; font-family: 'Courier New', Courier, monospace;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry Note -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
                This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #999999;">
                CanadaMade Foods Inc.
              </p>
              <p style="margin: 0; font-size: 12px; color: #bbbbbb;">
                Toronto, Ontario, Canada
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Clean plain text version
    const bodyText = `Hi ${firstName},

Here's your verification code:

${code}

This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.

---
CanadaMade Foods Inc.
Toronto, Ontario, Canada`;

    const payload = {
      personalizations: [
        {
          to: [{ email, name: firstName }],
        },
      ],
      from: {
        email: "info@canadamade.com",
        name: "CanadaMade",
      },
      reply_to: {
        email: "info@canadamade.com",
        name: "CanadaMade Support",
      },
      subject,
      content: [
        {
          type: "text/plain",
          value: bodyText,
        },
        {
          type: "text/html",
          value: bodyHtml,
        },
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
    console.error("send-verification-email error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", message: error.message }),
    };
  }
};

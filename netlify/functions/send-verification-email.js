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

    const firstName = first_name || "Valued Customer";
    const subject = "Your CanadaMade Verification Code 🍁";
    const logoUrl = process.env.SITE_URL ? `${process.env.SITE_URL}/logo.png` : "https://gulfexpo.canadamade.com/logo.png";
    const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - CanadaMade</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #fff8f0 0%, #ffffff 100%); border-bottom: 3px solid #e31837;">
              <img src="${logoUrl}" alt="CanadaMade" style="max-width: 180px; height: auto; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 14px; color: #e31837; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Gulf Expo Dubai 2026</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #1a1a1a; text-align: center;">Verify Your Email</h1>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #4b5563; text-align: center;">
                Hi <strong>${firstName}</strong>,
              </p>

              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.7; color: #4b5563; text-align: center;">
                Enter the code below to verify:
              </p>

              <!-- Verification Code Box -->
              <div style="text-align: center; margin: 40px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%); border: 2px solid #e31837; border-radius: 16px; padding: 24px 48px; box-shadow: 0 4px 12px rgba(227, 24, 55, 0.15);">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px;">Your Code</p>
                  <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #e31837; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;">
                    ${code}
                  </div>
                </div>
              </div>

              <p style="margin: 32px 0 0 0; font-size: 14px; line-height: 1.6; color: #9ca3af; text-align: center;">
                ⏱️ This code expires in <strong>10 minutes</strong>.<br>
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background-color: #1a1a1a;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #ffffff; font-weight: 600;">
                🍁 CanadaMade
              </p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #9ca3af;">
                Proudly crafted in Canada 🇨🇦
              </p>
              <p style="margin: 0; font-size: 11px; color: #6b7280;">
                © 2026 CanadaMade. All rights reserved.
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

    const payload = {
      personalizations: [
        {
          to: [{ email, name: first_name || "Valued Customer" }],
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
          value: `Hi ${
            first_name || "Valued Customer"
          },\n\nThank you for your interest in CanadaMade. Please use the verification code below to complete your registration:\n\n${code}\n\nThis code will expire in 10 minutes. If you didn't request this code, please ignore this email.\n\n© 2026 CanadaMade. All rights reserved.\nProudly crafted in Canada 🇨🇦`,
        },
        {
          type: "text/html",
          value: bodyHtml,
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
    console.error("send-verification-email error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", message: error.message }),
    };
  }
};

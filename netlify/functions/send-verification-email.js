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
    const subject = "Your CanadaMade Verification Code";
    const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #fff8f0; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #e31837;">CanadaMade</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Verify Your Email Address</h2>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #6b7280;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #6b7280;">
                Thank you for your interest in CanadaMade. Please use the verification code below to complete your registration:
              </p>
              <div style="text-align: center; margin: 40px 0;">
                <div style="display: inline-block; background-color: #fef2f2; border: 2px solid #e31837; border-radius: 12px; padding: 20px 40px;">
                  <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #e31837; font-family: 'Space Mono', monospace;">
                    ${code}
                  </div>
                </div>
              </div>
              <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © 2026 CanadaMade. All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
                Proudly crafted in Canada 🇨🇦
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

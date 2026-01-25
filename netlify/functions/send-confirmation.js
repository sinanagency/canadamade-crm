// netlify/functions/send-confirmation.js
// Sends confirmation message after successful verification via WhatsApp, Email, or SMS

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
      method,        // 'whatsapp', 'email', or 'sms'
      phone,         // phone number (for whatsapp/sms)
      email,         // email address (for email)
      first_name,    // recipient first name
      flavor,        // chosen flavor
    } = JSON.parse(event.body || "{}");

    if (!method || !first_name || !flavor) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields",
          details: "Required: method, first_name, flavor",
        }),
      };
    }

    const firstName = first_name || "Valued Customer";
    let result = { success: false };

    // ============ WHATSAPP ============
    if (method === "whatsapp") {
      if (!phone) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Phone required for WhatsApp" }),
        };
      }

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

      const cleanPhone = cleanPhoneNumber(phone);
      if (!cleanPhone) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid phone number format" }),
        };
      }

      const apiUrl = `${WHATSAPP_API_BASE_URL.replace(/\/$/, '')}/${WHATSAPP_VENDOR_UID}/contact/send-message?token=${WHATSAPP_API_TOKEN}`;

      const messageBody = `✅ *Verified!*

Hi ${firstName},

You're all set! Show this message to collect your FREE *${flavor}* sample.

🍁 CanadaMade | Gulf Expo Dubai 2026`;

      const payload = {
        from_phone_number_id: WHATSAPP_PHONE_NUMBER_ID,
        phone_number: cleanPhone,
        message_body: messageBody,
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      result.success = response.ok;
      if (!response.ok) {
        console.error("WhatsApp confirmation error:", await response.text());
      }
    }

    // ============ EMAIL ============
    else if (method === "email") {
      if (!email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Email required for email method" }),
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

      const logoUrl = process.env.SITE_URL ? `${process.env.SITE_URL}/logo.png` : "https://gulfexpo.canadamade.com/logo.png";

      const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #fff8f0 0%, #ffffff 100%); border-bottom: 3px solid #e31837;">
              <img src="${logoUrl}" alt="CanadaMade" style="max-width: 180px; height: auto; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 14px; color: #e31837; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Gulf Expo Dubai 2026</p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Verified!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <p style="margin: 0 0 24px 0; font-size: 18px; line-height: 1.7; color: #1a1a1a;">
                Hi <strong>${firstName}</strong>,
              </p>

              <p style="margin: 0 0 32px 0; font-size: 18px; line-height: 1.7; color: #4b5563;">
                You're all set! Show this email to collect your FREE sample:
              </p>

              <!-- Flavor Box -->
              <div style="display: inline-block; background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%); border: 2px solid #e31837; border-radius: 16px; padding: 24px 48px; margin-bottom: 32px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px;">Your Flavor</p>
                <div style="font-size: 28px; font-weight: 700; color: #e31837;">
                  🍟 ${flavor}
                </div>
              </div>

              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #6b7280;">
                Enjoy! 🍁
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background-color: #1a1a1a;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #ffffff; font-weight: 600;">🍁 CanadaMade</p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #9ca3af;">Proudly crafted in Canada 🇨🇦</p>
              <p style="margin: 0; font-size: 11px; color: #6b7280;">© 2026 CanadaMade. All rights reserved.</p>
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
        personalizations: [{ to: [{ email, name: firstName }] }],
        from: { email: "info@canadamade.com", name: "CanadaMade" },
        subject: "✅ Verified! Collect Your Free Sample",
        content: [
          {
            type: "text/plain",
            value: `Hi ${firstName},\n\nYou're verified! Show this email to collect your FREE ${flavor} sample.\n\nEnjoy!\n\n🍁 CanadaMade | Gulf Expo Dubai 2026`,
          },
          { type: "text/html", value: bodyHtml },
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

      result.success = response.ok;
      if (!response.ok) {
        console.error("Email confirmation error:", await response.text());
      }
    }

    // ============ SMS ============
    else if (method === "sms") {
      if (!phone) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Phone required for SMS" }),
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

      const messageBody = `CanadaMade: Verified! Show this message to collect your FREE ${flavor} sample. Enjoy!`;

      const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

      const formData = new URLSearchParams({
        To: phone,
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

      result.success = response.ok;
      if (!response.ok) {
        console.error("SMS confirmation error:", await response.text());
      }
    }

    else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid method. Use: whatsapp, email, or sms" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error("send-confirmation error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", message: error.message }),
    };
  }
};

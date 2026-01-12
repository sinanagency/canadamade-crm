// Simple manual test for netlify/functions/send-sms.js
// Usage:
//   1) Create a .env file in project root with:
//        SUPABASE_URL=...
//        SUPABASE_SERVICE_ROLE_KEY=...
//        TWILIO_ACCOUNT_SID=...
//        TWILIO_AUTH_TOKEN=...
//        TWILIO_PHONE_NUMBER=...
//        TEST_RECIPIENT_PHONE=...
//   2) Run:
//        node test/send-sms.test.js

require("dotenv").config();
const { handler } = require("../netlify/functions/send-sms");

async function run() {
  const testPhone = process.env.TEST_RECIPIENT_PHONE || "+14847498026";

  const event = {
    httpMethod: "POST",
    body: JSON.stringify({
      phone: testPhone,
      first_name: "Test",
      flavor: "Barbeque",
    }),
  };

  console.log("Invoking send-sms with payload:", event.body);

  try {
    const result = await handler(event, {});
    console.log("Result statusCode:", result.statusCode);
    console.log("Result body:", result.body);
  } catch (err) {
    console.error("Error invoking handler:", err);
  }
}

run();

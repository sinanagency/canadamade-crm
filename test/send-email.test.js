// Simple manual test for netlify/functions/send-email.js
// Usage:
//   1) Create a .env file in project root with:
//        SUPABASE_URL=...
//        SUPABASE_SERVICE_ROLE_KEY=...
//        SENDGRID_API_KEY=...
//        TEST_RECIPIENT_EMAIL=...
//   2) Run:
//        node test/send-email.test.js

require("dotenv").config();
const { handler } = require("../netlify/functions/send-email");

async function run() {
  const testEmail =
    process.env.TEST_RECIPIENT_EMAIL || "brianeliondev@gmail.com";

  const event = {
    httpMethod: "POST",
    body: JSON.stringify({
      email: testEmail,
      first_name: "Test",
      flavor: "Barbeque",
    }),
  };

  console.log("Invoking send-email with payload:", event.body);

  try {
    const result = await handler(event, {});
    console.log("Result statusCode:", result.statusCode);
    console.log("Result body:", result.body);
  } catch (err) {
    console.error("Error invoking handler:", err);
  }
}

run();

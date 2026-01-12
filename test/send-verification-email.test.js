require("dotenv").config();
const { handler } = require("../netlify/functions/send-verification-email");

async function run() {
  const testEmail =
    process.env.TEST_RECIPIENT_EMAIL || "brianeliondev@gmail.com";

  const event = {
    httpMethod: "POST",
    body: JSON.stringify({
      email: testEmail,
      code: "1234",
      first_name: "Test",
    }),
  };

  console.log("Invoking send-verification-email with payload:", event.body);

  try {
    const result = await handler(event, {});
    console.log("Result statusCode:", result.statusCode);
    console.log("Result body:", result.body);
  } catch (err) {
    console.error("Error invoking handler:", err);
  }
}

run();

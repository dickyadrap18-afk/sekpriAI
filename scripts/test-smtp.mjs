/**
 * Test SMTP connection and send directly.
 * Usage: node scripts/test-smtp.mjs <gmail_app_password>
 * Example: node scripts/test-smtp.mjs "abcd efgh ijkl mnop"
 */

const appPassword = process.argv[2];
if (!appPassword) {
  console.error("Usage: node scripts/test-smtp.mjs <gmail_app_password>");
  process.exit(1);
}

const FROM = "wondertechgadget@gmail.com";
const TO   = "dicky.adrap18@gmail.com";

// Use nodemailer from the project
const { createTransport } = await import("nodemailer");

console.log("\n🔧 Testing SMTP connection to smtp.gmail.com:587...");

const transport = createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: FROM, pass: appPassword.replace(/\s/g, "") },
  tls: { rejectUnauthorized: true },
  debug: true,
  logger: true,
});

try {
  console.log("\n📡 Verifying connection...");
  await transport.verify();
  console.log("✅ SMTP connection OK\n");
} catch (err) {
  console.error("❌ SMTP verify failed:", err.message);
  console.error("\nCommon causes:");
  console.error("  - Wrong App Password (must be 16 chars, no spaces)");
  console.error("  - 2FA not enabled on Gmail account");
  console.error("  - App Password not generated for 'Mail'");
  process.exit(1);
}

try {
  console.log(`📧 Sending test email from ${FROM} to ${TO}...`);
  const info = await transport.sendMail({
    from: `"sekpriAI Test" <${FROM}>`,
    to: TO,
    subject: "sekpriAI SMTP Test",
    text: "This is a test email from sekpriAI SMTP diagnostic script.",
  });
  console.log("✅ Email sent!");
  console.log("   Message ID:", info.messageId);
  console.log("   Response:  ", info.response);
  console.log("   Accepted:  ", info.accepted);
  console.log("   Rejected:  ", info.rejected);
} catch (err) {
  console.error("❌ Send failed:", err.message);
  if (err.code) console.error("   Error code:", err.code);
  if (err.response) console.error("   SMTP response:", err.response);
}

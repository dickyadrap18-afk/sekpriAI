/**
 * Test SMTP directly using credentials from Supabase.
 * Runs locally — no Vercel needed.
 * Usage: node scripts/test-smtp-direct.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { createDecipheriv } from "crypto";

// Read from env
const SUPABASE_URL = "https://bggzhfujjotofotctspy.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZ3poZnVqam90b2ZvdGN0c3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc1NjM5MiwiZXhwIjoyMDk0MzMyMzkyfQ.kvXoT9XajYAxCYRkF5fQHg4TAKwvJyCXj-Ez-sADSS0";
const ENCRYPTION_KEY = "d3338449f0e10b01173cb5a3cb71ebf2d5dd89039c16cdd6ede03f517babb3cb";
const TO = "dicky.adrap18@gmail.com";
const FROM_EMAIL = "wondertechgadget@gmail.com";

function decrypt(ciphertext) {
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid ciphertext format");
  const iv = Buffer.from(parts[0], "base64");
  const encrypted = parts[1];
  const tag = Buffer.from(parts[2], "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

console.log("🔍 Fetching account from Supabase...");
const sb = createClient(SUPABASE_URL, SERVICE_KEY);
const { data: account, error } = await sb
  .from("email_accounts")
  .select("*")
  .eq("email_address", FROM_EMAIL)
  .single();

if (error || !account) {
  console.error("❌ Account not found:", error?.message);
  process.exit(1);
}

console.log("✅ Account found:");
console.log("   email:", account.email_address);
console.log("   smtp_host:", account.smtp_host);
console.log("   smtp_port:", account.smtp_port);
console.log("   imap_username:", account.imap_username);
console.log("   has_password:", !!account.imap_password_encrypted);

let password;
try {
  password = decrypt(account.imap_password_encrypted);
  console.log("✅ Password decrypted, length:", password.length);
} catch (e) {
  console.error("❌ Decrypt failed:", e.message);
  process.exit(1);
}

console.log("\n📡 Testing SMTP connection...");
const { createTransport } = await import("nodemailer");
const isSSL = account.smtp_port === 465;
const transport = createTransport({
  host: account.smtp_host,
  port: account.smtp_port,
  secure: isSSL,
  requireTLS: !isSSL,
  auth: { user: account.imap_username || account.email_address, pass: password },
  tls: { rejectUnauthorized: true },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
});

try {
  await transport.verify();
  console.log("✅ SMTP verify OK");
} catch (e) {
  console.error("❌ SMTP verify failed:", e.message);
  if (e.code) console.error("   code:", e.code);
  if (e.response) console.error("   response:", e.response);
  process.exit(1);
}

console.log(`\n📧 Sending test email to ${TO}...`);
try {
  const info = await transport.sendMail({
    from: `"${account.display_name || account.email_address}" <${account.email_address}>`,
    to: TO,
    subject: "[sekpriAI] SMTP Test " + new Date().toLocaleTimeString(),
    text: "This is a direct SMTP test from sekpriAI.\n\nIf you receive this, email sending is working correctly.",
  });
  console.log("✅ Email sent successfully!");
  console.log("   messageId:", info.messageId);
  console.log("   response:", info.response);
  console.log("   accepted:", info.accepted);
  console.log("   rejected:", info.rejected);
} catch (e) {
  console.error("❌ Send failed:", e.message);
  if (e.code) console.error("   code:", e.code);
  if (e.response) console.error("   response:", e.response);
  if (e.responseCode) console.error("   responseCode:", e.responseCode);
}

/**
 * Set Telegram webhook URL.
 * Usage: node scripts/set-telegram-webhook.mjs <APP_URL>
 * Example: node scripts/set-telegram-webhook.mjs https://sekpriai.vercel.app
 *
 * Reads TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET from .env.local
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = env.TELEGRAM_WEBHOOK_SECRET;
const APP_URL = process.argv[2] || env.NEXT_PUBLIC_APP_URL;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN not set in .env.local");
  process.exit(1);
}
if (!WEBHOOK_SECRET) {
  console.error("❌ TELEGRAM_WEBHOOK_SECRET not set in .env.local");
  process.exit(1);
}
if (!APP_URL || APP_URL === "http://localhost:3000") {
  console.error("❌ Provide a public URL as argument: node scripts/set-telegram-webhook.mjs https://your-app.vercel.app");
  process.exit(1);
}

const webhookUrl = `${APP_URL}/api/telegram/webhook/${WEBHOOK_SECRET}`;

console.log(`\n🤖 Bot token: ${BOT_TOKEN.slice(0, 10)}...`);
console.log(`🔗 Setting webhook to: ${webhookUrl}\n`);

const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  }),
});

const data = await res.json();

if (data.ok) {
  console.log("✅ Webhook set successfully!");
  console.log(`   URL: ${webhookUrl}`);
} else {
  console.error("❌ Failed to set webhook:", data.description);
}

// Also get webhook info to confirm
const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
const info = await infoRes.json();
console.log("\n📋 Webhook info:");
console.log(`   URL: ${info.result?.url || "(none)"}`);
console.log(`   Pending updates: ${info.result?.pending_update_count ?? 0}`);
if (info.result?.last_error_message) {
  console.log(`   Last error: ${info.result.last_error_message}`);
}

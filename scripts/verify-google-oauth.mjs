#!/usr/bin/env node

/**
 * Verify Google OAuth configuration
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, "..", ".env.local");
    const content = readFileSync(envPath, "utf-8");
    const env = {};
    
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join("=").trim();
        }
      }
    }
    
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();

console.log("🔍 Google OAuth Configuration Check\n");

const required = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXT_PUBLIC_APP_URL",
];

let ok = true;

for (const key of required) {
  const val = env[key];
  if (val) {
    const display = key.includes("SECRET") ? `${val.substring(0, 10)}...` : val;
    console.log(`✅ ${key}: ${display}`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    ok = false;
  }
}

console.log();

if (ok) {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  console.log("🔗 Redirect URIs to add in Google Cloud Console:");
  console.log(`   ${appUrl}/api/auth/callback/google`);
  console.log(`   ${appUrl}/api/auth/callback/gmail`);
  console.log();
  console.log("✅ Configuration looks good!");
  console.log("   Start dev server and test: npm run dev");
} else {
  console.log("❌ Missing configuration. Check .env.local");
  process.exit(1);
}

import "server-only";

import { NextRequest } from "next/server";

/**
 * Validate cron endpoint requests.
 * Vercel sends x-vercel-cron-signature for cron jobs.
 * For manual triggers, require CRON_SECRET in Authorization header.
 * Ref: audit-report.md SEC-02
 */
export function validateCronRequest(request: NextRequest): boolean {
  // Vercel cron jobs include this header automatically
  const vercelCron = request.headers.get("x-vercel-cron-signature");
  if (vercelCron) return true;

  // Manual trigger: check Authorization header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // If no CRON_SECRET configured, allow in development only
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

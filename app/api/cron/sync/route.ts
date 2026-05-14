import { NextRequest, NextResponse } from "next/server";
import { syncAllAccounts } from "@/features/email/server/sync";
import { validateCronRequest } from "@/lib/security/cron-auth";

/**
 * Vercel Cron endpoint: runs every 1 minute.
 * Syncs all connected email accounts.
 * Protected by CRON_SECRET or Vercel cron signature.
 * Ref: specs/006-provider-integration-spec.md §5
 */
export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllAccounts();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}

// Also allow GET for manual trigger (still requires auth)
export async function GET(request: NextRequest) {
  return POST(request);
}

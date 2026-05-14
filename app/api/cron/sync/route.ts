import { NextResponse } from "next/server";
import { syncAllAccounts } from "@/features/email/server/sync";

/**
 * Vercel Cron endpoint: runs every 1 minute.
 * Syncs all connected email accounts.
 * Ref: specs/006-provider-integration-spec.md §5
 */
export async function POST() {
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

// Also allow GET for manual trigger
export async function GET() {
  return POST();
}

import { NextResponse } from "next/server";
import { flushDueScheduledEmails } from "@/features/scheduler/server/approval";

/**
 * Vercel Cron: flush due, approved scheduled emails.
 * Runs every 1 minute alongside sync.
 * Ref: specs/009-implementation-timeline.md Phase 8
 */
export async function POST() {
  try {
    const result = await flushDueScheduledEmails();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scheduler failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

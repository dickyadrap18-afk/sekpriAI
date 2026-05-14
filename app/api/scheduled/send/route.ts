import { NextRequest, NextResponse } from "next/server";
import { flushDueScheduledEmails } from "@/features/scheduler/server/approval";
import { validateCronRequest } from "@/lib/security/cron-auth";

/**
 * Vercel Cron: flush due, approved scheduled emails.
 * Protected by CRON_SECRET or Vercel cron signature.
 * Ref: specs/009-implementation-timeline.md Phase 8
 */
export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

export async function GET(request: NextRequest) {
  return POST(request);
}

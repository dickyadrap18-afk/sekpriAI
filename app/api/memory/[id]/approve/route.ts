import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Approve a pending memory item (set status to 'active').
 * Ref: specs/005-ai-agent-spec.md §6 — memory activation requires user approval.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("memory_items")
    .update({ status: "active", approved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

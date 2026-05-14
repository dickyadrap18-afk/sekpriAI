import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { processMessage } from "@/features/ai/server/process";
import type { Message } from "@/lib/supabase/types";

const schema = z.object({
  message_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: message } = await supabase
    .from("messages")
    .select("*")
    .eq("id", parsed.data.message_id)
    .eq("user_id", user.id)
    .single();

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  await processMessage(message as Message);

  // Return updated message
  const { data: updated } = await supabase
    .from("messages")
    .select("ai_summary, ai_priority, ai_priority_reason, ai_risk_level, ai_risk_reason")
    .eq("id", parsed.data.message_id)
    .single();

  return NextResponse.json(updated);
}

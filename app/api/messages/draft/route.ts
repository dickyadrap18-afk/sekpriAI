import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runDraftReply } from "@/features/ai/prompts/draft-reply";

/**
 * Generate an AI reply draft for a message.
 * Ref: specs/005-ai-agent-spec.md §3 (draft-reply)
 */

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
    .single();

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const from = message.from_name
    ? `${message.from_name} <${message.from_email}>`
    : message.from_email;

  const draft = await runDraftReply({
    from,
    subject: message.subject || "(no subject)",
    body: message.body_text || message.snippet || "",
  });

  // Log the AI action
  await supabase.from("ai_actions").insert({
    user_id: user.id,
    feature: "draft",
    input: { message_id: message.id },
    output: draft,
    model: "default",
  });

  return NextResponse.json(draft);
}

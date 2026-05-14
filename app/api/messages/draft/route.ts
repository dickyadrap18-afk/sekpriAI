import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runDraftReply } from "@/features/ai/prompts/draft-reply";
import { retrieveContext, formatContext } from "@/features/rag/server/retrieve";

/**
 * Generate an AI reply draft for a message.
 * Uses RAG context (email + attachment chunks) and active memory.
 * Ref: specs/005-ai-agent-spec.md §3 (draft-reply), §5 (RAG retrieval)
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
    .eq("user_id", user.id)
    .single();

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const from = message.from_name
    ? `${message.from_name} <${message.from_email}>`
    : message.from_email;

  // Retrieve RAG context (email + attachment chunks)
  let ragContext = "";
  try {
    const query = `${message.subject || ""} ${message.snippet || ""}`.trim();
    if (query) {
      const chunks = await retrieveContext(user.id, query, 6);
      ragContext = formatContext(chunks);
    }
  } catch {
    // RAG failure is non-fatal
  }

  // Retrieve active memory items
  const { data: memoryItems } = await supabase
    .from("memory_items")
    .select("content, memory_type")
    .eq("status", "active")
    .limit(10);

  const memoryContext = memoryItems?.length
    ? "\nActive memory:\n" +
      memoryItems.map((m) => `- [${m.memory_type}] ${m.content}`).join("\n")
    : "";

  const fullContext = [ragContext, memoryContext].filter(Boolean).join("\n\n");

  try {
    const draft = await runDraftReply({
      from,
      subject: message.subject || "(no subject)",
      body: message.body_text || message.snippet || "",
      context: fullContext || undefined,
    });

    // Log the AI action
    await supabase.from("ai_actions").insert({
      user_id: user.id,
      feature: "draft",
      input: { message_id: message.id, has_rag: !!ragContext, has_memory: !!memoryContext },
      output: draft,
      model: "default",
    });

    return NextResponse.json({
      body: draft.body,
      subject: draft.subject,
      tone: draft.tone,
      needs_approval: draft.needs_approval,
    });
  } catch (err) {
    const message_err = err instanceof Error ? err.message : "AI draft generation failed";
    console.error("Draft route error:", message_err);
    return NextResponse.json({ error: message_err }, { status: 500 });
  }
}

import "server-only";

import { getServiceClient } from "@/lib/supabase/service";
import { runExtractMemory } from "@/features/ai/prompts/extract-memory";
import type { Message } from "@/lib/supabase/types";

/**
 * Extract memory candidates from a message and store as pending.
 * Ref: specs/005-ai-agent-spec.md §3 (extract-memory)
 */
export async function extractMemoryFromMessage(message: Message): Promise<number> {
  const from = message.from_name
    ? `${message.from_name} <${message.from_email}>`
    : message.from_email;

  const items = await runExtractMemory({
    from,
    subject: message.subject || "(no subject)",
    body: message.body_text || message.snippet || "",
  });

  if (items.length === 0) return 0;

  const supabase = getServiceClient();

  await supabase.from("memory_items").insert(
    items.map((item) => ({
      user_id: message.user_id,
      source_message_id: message.id,
      memory_type: item.memory_type,
      content: item.content,
      confidence: item.confidence,
      status: "pending",
      created_by: "ai",
    }))
  );

  // Log AI action
  await supabase.from("ai_actions").insert({
    user_id: message.user_id,
    feature: "extract_memory",
    input: { message_id: message.id },
    output: { count: items.length },
    model: "default",
  });

  return items.length;
}

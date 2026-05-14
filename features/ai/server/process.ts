import "server-only";

import { getServiceClient } from "@/lib/supabase/service";
import { runSummarize } from "../prompts/summarize";
import { runPriority } from "../prompts/priority";
import { runRisk } from "../prompts/risk";
import { extractMemoryFromMessage } from "@/features/memory/server/actions";
import { indexContent } from "@/features/rag/server/index";
import type { Message } from "@/lib/supabase/types";

/**
 * Process a batch of unprocessed messages with AI.
 * Runs summarize, priority, and risk for each.
 * Logs to ai_actions.
 * Ref: specs/005-ai-agent-spec.md §4
 */

export async function processMessage(message: Message): Promise<void> {
  const supabase = getServiceClient();
  const from = message.from_name
    ? `${message.from_name} <${message.from_email}>`
    : message.from_email;
  const subject = message.subject || "(no subject)";
  const body = message.body_text || message.snippet || "";

  try {
    // Run all three classifiers
    const [summary, priority, risk] = await Promise.all([
      runSummarize({ from, subject, body }),
      runPriority({ from, subject, snippet: body.slice(0, 500) }),
      runRisk({ from, subject, body }),
    ]);

    // Update message with AI results
    await supabase
      .from("messages")
      .update({
        ai_summary: summary.one_sentence_summary,
        ai_priority: priority.priority,
        ai_priority_reason: priority.reason,
        ai_risk_level: risk.risk_level,
        ai_risk_reason: risk.reason,
        ai_suggested_action: summary.suggested_action ?? null,
        ai_processed_at: new Date().toISOString(),
      })
      .eq("id", message.id);

    // Log AI actions
    await supabase.from("ai_actions").insert([
      {
        user_id: message.user_id,
        feature: "summarize",
        input: { message_id: message.id },
        output: summary,
        model: "default",
      },
      {
        user_id: message.user_id,
        feature: "priority",
        input: { message_id: message.id },
        output: priority,
        model: "default",
      },
      {
        user_id: message.user_id,
        feature: "risk",
        input: { message_id: message.id },
        output: risk,
        model: "default",
      },
    ]);

    // Extract memory candidates (stored as pending)
    try {
      await extractMemoryFromMessage(message);
    } catch {
      // Memory extraction failure is non-fatal
    }

    // Index email body into RAG for future retrieval
    try {
      const textToIndex = [subject, body].filter(Boolean).join("\n\n");
      if (textToIndex.length > 50) {
        await indexContent({
          userId: message.user_id,
          sourceType: "email",
          sourceId: message.id,
          text: textToIndex,
        });
      }
    } catch {
      // RAG indexing failure is non-fatal
    }
  } catch (err) {
    // AI failure is non-fatal: message stays without AI fields
    console.error(
      `AI processing failed for message ${message.id}:`,
      err instanceof Error ? err.message : err
    );
  }
}

export async function processUnprocessedMessages(): Promise<number> {
  const supabase = getServiceClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .is("ai_processed_at", null)
    .order("received_at", { ascending: false })
    .limit(10);

  if (!messages || messages.length === 0) return 0;

  for (const msg of messages as Message[]) {
    await processMessage(msg);
  }

  return messages.length;
}

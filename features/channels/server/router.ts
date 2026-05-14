import "server-only";

import { getServiceClient } from "@/lib/supabase/service";
import { runParseChannelIntent } from "@/features/ai/prompts/parse-channel-intent";
import { escapePostgrestLike } from "@/lib/utils/escape-postgrest";
import type { ChannelIntent } from "@/features/ai/prompts/parse-channel-intent";

/**
 * Route a parsed intent to the correct handler and return a text response.
 * Ref: specs/007-telegram-whatsapp-spec.md §6
 */

const WELCOME_MESSAGE = `Welcome to sekpriAI.

I am your AI email secretary. I can notify you about important emails, summarize threads, draft replies, and help you send or schedule emails after your approval.

Try:
- Summarize my latest email
- Draft a reply to Sarah
- What urgent emails did I receive today?
- Schedule this reply for tomorrow morning
- Send the approved draft

I will ask for confirmation before sending sensitive emails.`;

export async function handleCommand(
  userId: string,
  command: string
): Promise<string> {
  let intent: ChannelIntent;

  try {
    intent = await runParseChannelIntent(command);
  } catch {
    return "Sorry, I couldn't understand that command. Try: Summarize my latest email";
  }

  const supabase = getServiceClient();

  switch (intent.intent_type) {
    case "summarize_latest": {
      const { data: msg } = await supabase
        .from("messages")
        .select("from_name, from_email, subject, ai_summary, snippet")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("received_at", { ascending: false })
        .limit(1)
        .single();

      if (!msg) return "No messages found in your inbox.";

      const summary = msg.ai_summary || msg.snippet || "No summary available.";
      return `Latest email from ${msg.from_name || msg.from_email}:\nSubject: ${msg.subject || "(no subject)"}\n\n${summary}`;
    }

    case "list_urgent": {
      const { data: msgs } = await supabase
        .from("messages")
        .select("from_name, from_email, subject")
        .eq("user_id", userId)
        .eq("ai_priority", "high")
        .eq("is_deleted", false)
        .eq("is_archived", false)
        .order("received_at", { ascending: false })
        .limit(5);

      if (!msgs || msgs.length === 0) return "No urgent emails today.";

      const list = msgs
        .map((m, i) => `${i + 1}. ${m.from_name || m.from_email}: ${m.subject || "(no subject)"}`)
        .join("\n");

      return `Urgent emails:\n${list}`;
    }

    case "search": {
      const query = intent.target || command;
      const escaped = escapePostgrestLike(query);
      const { data: msgs } = await supabase
        .from("messages")
        .select("from_name, from_email, subject, snippet")
        .eq("user_id", userId)
        .or(`subject.ilike.%${escaped}%,snippet.ilike.%${escaped}%`)
        .order("received_at", { ascending: false })
        .limit(5);

      if (!msgs || msgs.length === 0) return `No emails found matching "${query}".`;

      const list = msgs
        .map((m, i) => `${i + 1}. ${m.from_name || m.from_email}: ${m.subject || "(no subject)"}`)
        .join("\n");

      return `Search results for "${query}":\n${list}`;
    }

    case "draft_reply":
    case "reply_with_text":
      return `I'll prepare a draft reply${intent.target ? ` to ${intent.target}` : ""}. This requires your approval before sending. (Draft feature available in the app.)`;

    case "schedule_send":
      return `I'll schedule that${intent.instruction ? ` for ${intent.instruction}` : ""}. You'll need to approve it before it sends. (Schedule feature available in the app.)`;

    case "send_approved":
      return "Checking for approved drafts... (Send feature requires approval in the app.)";

    case "cancel_scheduled":
      return "I'll cancel the scheduled email. (Manage scheduled emails in the app.)";

    case "unknown":
    default:
      return WELCOME_MESSAGE;
  }
}

export { WELCOME_MESSAGE };

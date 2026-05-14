import "server-only";

import { getServiceClient } from "@/lib/supabase/service";
import { runParseChannelIntent } from "@/features/ai/prompts/parse-channel-intent";
import { escapePostgrestLike } from "@/lib/utils/escape-postgrest";
import type { ChannelIntent } from "@/features/ai/prompts/parse-channel-intent";

/**
 * Route a parsed intent to the correct handler and return a text response.
 * Ref: specs/007-telegram-whatsapp-spec.md §6
 *
 * Tone: warm, concise, personal secretary — not a chatbot or system message.
 * - Use first person ("I've checked...", "Here's what I found...")
 * - Avoid robotic phrases ("No messages found", "Feature available in app")
 * - Use light formatting with emoji sparingly for scannability
 * - Mirror the user's language (Indonesian if they write in Indonesian)
 */

export const WELCOME_MESSAGE = `Hey! I'm your sekpriAI assistant 👋

I keep an eye on your inbox and help you stay on top of things. Here's what I can do for you:

📬 *Summarize* — "What's my latest email?"
⚡ *Urgent* — "Any important emails today?"
🔍 *Search* — "Find emails about the contract"
✍️ *Draft* — "Draft a reply to Sarah"
📅 *Schedule* — "Schedule this reply for tomorrow morning"
✅ *Send* — "Send the approved draft"

Just write naturally — no need for special commands. I'll figure out what you need.`;

/** Format a relative time label from a date string */
function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export async function handleCommand(
  userId: string,
  command: string
): Promise<string> {
  let intent: ChannelIntent;

  try {
    intent = await runParseChannelIntent(command);
  } catch {
    return "Hmm, I didn't quite catch that. Try something like:\n- \"What's my latest email?\"\n- \"Any urgent emails today?\"\n- \"Draft a reply to John\"";
  }

  const supabase = getServiceClient();

  switch (intent.intent_type) {
    case "summarize_latest": {
      const { data: msg } = await supabase
        .from("messages")
        .select("from_name, from_email, subject, ai_summary, snippet, received_at")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("received_at", { ascending: false })
        .limit(1)
        .single();

      if (!msg) return "Your inbox looks clear — no emails to show right now.";

      const sender = msg.from_name || msg.from_email || "Unknown sender";
      const subject = msg.subject || "(no subject)";
      const summary = msg.ai_summary || msg.snippet || "No summary available.";
      const when = relativeTime(msg.received_at);

      return `📬 Latest email${when ? ` · ${when}` : ""}\n\nFrom: ${sender}\nSubject: ${subject}\n\n${summary}`;
    }

    case "list_urgent": {
      const { data: msgs } = await supabase
        .from("messages")
        .select("from_name, from_email, subject, received_at")
        .eq("user_id", userId)
        .eq("ai_priority", "high")
        .eq("is_deleted", false)
        .eq("is_archived", false)
        .order("received_at", { ascending: false })
        .limit(5);

      if (!msgs || msgs.length === 0)
        return "Nothing urgent right now — your inbox is looking calm 👌";

      const list = msgs
        .map((m, i) => {
          const sender = m.from_name || m.from_email || "Unknown";
          const subject = m.subject || "(no subject)";
          const when = relativeTime(m.received_at);
          return `${i + 1}. ${sender} — ${subject}${when ? ` (${when})` : ""}`;
        })
        .join("\n");

      return `⚡ ${msgs.length} urgent email${msgs.length > 1 ? "s" : ""} need your attention:\n\n${list}`;
    }

    case "search": {
      const query = intent.target || command;
      const escaped = escapePostgrestLike(query);
      const { data: msgs } = await supabase
        .from("messages")
        .select("from_name, from_email, subject, received_at")
        .eq("user_id", userId)
        .or(`subject.ilike.%${escaped}%,snippet.ilike.%${escaped}%`)
        .order("received_at", { ascending: false })
        .limit(5);

      if (!msgs || msgs.length === 0)
        return `I searched for "${query}" but didn't find anything. Try different keywords?`;

      const list = msgs
        .map((m, i) => {
          const sender = m.from_name || m.from_email || "Unknown";
          const subject = m.subject || "(no subject)";
          const when = relativeTime(m.received_at);
          return `${i + 1}. ${sender} — ${subject}${when ? ` (${when})` : ""}`;
        })
        .join("\n");

      return `🔍 Found ${msgs.length} result${msgs.length > 1 ? "s" : ""} for "${query}":\n\n${list}`;
    }

    case "draft_reply":
    case "reply_with_text": {
      const target = intent.target ? ` to ${intent.target}` : "";
      return `✍️ I'll draft a reply${target} for you. Head over to the app to review and approve it before I send anything.\n\n👉 ${process.env.NEXT_PUBLIC_APP_URL || "sekpri-ai-pi.vercel.app"}`;
    }

    case "schedule_send": {
      const when = intent.instruction ? ` for ${intent.instruction}` : "";
      return `📅 Got it — I'll schedule that${when}. You'll need to approve it in the app before it goes out.\n\n👉 ${process.env.NEXT_PUBLIC_APP_URL || "sekpri-ai-pi.vercel.app"}`;
    }

    case "send_approved":
      return `✅ I'll check for any approved drafts ready to send. Open the app to confirm and send.\n\n👉 ${process.env.NEXT_PUBLIC_APP_URL || "sekpri-ai-pi.vercel.app"}`;

    case "cancel_scheduled":
      return `🗑️ I'll cancel the scheduled email. You can manage all scheduled emails in the app.\n\n👉 ${process.env.NEXT_PUBLIC_APP_URL || "sekpri-ai-pi.vercel.app"}`;

    case "unknown":
    default:
      return WELCOME_MESSAGE;
  }
}


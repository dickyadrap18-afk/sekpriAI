import "server-only";

import { getServiceClient } from "@/lib/supabase/service";
import { runParseChannelIntent } from "@/features/ai/prompts/parse-channel-intent";
import { runDraftReply } from "@/features/ai/prompts/draft-reply";
import { escapePostgrestLike } from "@/lib/utils/escape-postgrest";
import type { ChannelIntent } from "@/features/ai/prompts/parse-channel-intent";

/**
 * Route a parsed intent to the correct handler and return a text response.
 * Ref: specs/007-telegram-whatsapp-spec.md §6
 *
 * Tone: warm, concise, personal secretary — not a chatbot or system message.
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

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sekpri-ai-pi.vercel.app";

export async function handleCommand(userId: string, command: string): Promise<string> {
  let intent: ChannelIntent;

  try {
    intent = await runParseChannelIntent(command);
  } catch {
    return "Hmm, I didn't quite catch that. Try:\n- \"What's my latest email?\"\n- \"Any urgent emails today?\"\n- \"Draft a reply to John\"";
  }

  const supabase = getServiceClient();

  switch (intent.intent_type) {

    case "summarize_latest": {
      const { data: msg } = await supabase
        .from("messages")
        .select("from_name, from_email, subject, ai_summary, ai_suggested_action, snippet, received_at")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .not("labels", "ov", "{SENT}")
        .not("labels", "ov", "{DRAFT}")
        .order("received_at", { ascending: false })
        .limit(1)
        .single();

      if (!msg) return "Your inbox looks clear — no emails to show right now.";

      const sender = msg.from_name || msg.from_email || "Unknown sender";
      const subject = msg.subject || "(no subject)";
      const summary = msg.ai_summary || msg.snippet || "No summary available.";
      const when = relativeTime(msg.received_at);
      const action = msg.ai_suggested_action ? `\n\n💡 Suggested: ${msg.ai_suggested_action}` : "";

      return `📬 Latest email${when ? ` · ${when}` : ""}\n\nFrom: ${sender}\nSubject: ${subject}\n\n${summary}${action}`;
    }

    case "list_urgent": {
      const { data: msgs } = await supabase
        .from("messages")
        .select("from_name, from_email, subject, received_at, ai_suggested_action")
        .eq("user_id", userId)
        .eq("ai_priority", "high")
        .eq("is_deleted", false)
        .eq("is_archived", false)
        .order("received_at", { ascending: false })
        .limit(5);

      if (!msgs || msgs.length === 0)
        return "Nothing urgent right now — your inbox is looking calm 👌";

      const list = msgs.map((m, i) => {
        const sender = m.from_name || m.from_email || "Unknown";
        const subject = m.subject || "(no subject)";
        const when = relativeTime(m.received_at);
        return `${i + 1}. ${sender} — ${subject}${when ? ` (${when})` : ""}`;
      }).join("\n");

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

      const list = msgs.map((m, i) => {
        const sender = m.from_name || m.from_email || "Unknown";
        const subject = m.subject || "(no subject)";
        const when = relativeTime(m.received_at);
        return `${i + 1}. ${sender} — ${subject}${when ? ` (${when})` : ""}`;
      }).join("\n");

      return `🔍 Found ${msgs.length} result${msgs.length > 1 ? "s" : ""} for "${query}":\n\n${list}`;
    }

    case "draft_reply":
    case "reply_with_text": {
      // Find the most recent email matching the target (if specified)
      let msgQuery = supabase
        .from("messages")
        .select("id, from_name, from_email, subject, body_text, snippet, received_at")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .not("labels", "ov", "{SENT}")
        .order("received_at", { ascending: false });

      if (intent.target) {
        const escaped = escapePostgrestLike(intent.target);
        msgQuery = msgQuery.or(
          `from_name.ilike.%${escaped}%,from_email.ilike.%${escaped}%,subject.ilike.%${escaped}%`
        );
      }

      const { data: msg } = await msgQuery.limit(1).single();

      if (!msg) {
        const target = intent.target ? ` from ${intent.target}` : "";
        return `I couldn't find a recent email${target} to reply to. Check your inbox in the app.\n\n👉 ${APP_URL}/inbox`;
      }

      // Generate AI draft directly
      try {
        const from = msg.from_name ? `${msg.from_name} <${msg.from_email}>` : msg.from_email;
        const draft = await runDraftReply({
          from,
          subject: msg.subject || "(no subject)",
          body: msg.body_text || msg.snippet || "",
        });

        // Save draft to DB
        const { data: account } = await supabase
          .from("email_accounts")
          .select("id, email_address, display_name, provider")
          .eq("user_id", userId)
          .limit(1)
          .single();

        if (account) {
          await supabase.from("messages").insert({
            user_id: userId,
            account_id: account.id,
            provider: account.provider,
            provider_message_id: `draft-tg-${Date.now()}`,
            from_email: account.email_address,
            from_name: account.display_name || account.email_address,
            to_emails: [msg.from_email],
            subject: draft.subject,
            body_text: draft.body,
            snippet: draft.body.slice(0, 200),
            labels: ["DRAFT"],
            is_read: true,
            is_archived: false,
            is_deleted: false,
            received_at: new Date().toISOString(),
          });
        }

        const preview = draft.body.slice(0, 300) + (draft.body.length > 300 ? "..." : "");
        const approvalNote = draft.needs_approval
          ? "\n\n⚠️ This reply involves sensitive content — please review carefully before sending."
          : "";

        return `✍️ Draft reply to ${msg.from_name || msg.from_email}:\n\nSubject: ${draft.subject}\n\n${preview}${approvalNote}\n\n📱 Review and send in the app:\n👉 ${APP_URL}/inbox?folder=drafts`;
      } catch {
        return `✍️ I found the email from ${msg.from_name || msg.from_email} but couldn't generate a draft right now. Try in the app:\n\n👉 ${APP_URL}/inbox`;
      }
    }

    case "schedule_send": {
      const when = intent.instruction ? ` for ${intent.instruction}` : "";
      return `📅 Got it — I'll schedule that${when}. You'll need to approve it in the app before it goes out.\n\n👉 ${APP_URL}/inbox`;
    }

    case "send_approved": {
      // Check for pending approved drafts
      const { data: drafts } = await supabase
        .from("messages")
        .select("subject, to_emails")
        .eq("user_id", userId)
        .contains("labels", ["DRAFT"])
        .eq("is_deleted", false)
        .limit(3);

      if (!drafts || drafts.length === 0)
        return "No drafts waiting to be sent. Compose a new email in the app.\n\n👉 " + APP_URL + "/inbox";

      const list = drafts.map((d, i) =>
        `${i + 1}. "${d.subject || "(no subject)"}" → ${(d.to_emails as string[])?.[0] || "?"}`
      ).join("\n");

      return `📤 You have ${drafts.length} draft${drafts.length > 1 ? "s" : ""} ready:\n\n${list}\n\nOpen the app to review and send:\n👉 ${APP_URL}/inbox?folder=drafts`;
    }

    case "cancel_scheduled": {
      const { data: scheduled } = await supabase
        .from("scheduled_emails")
        .select("id, payload, scheduled_for")
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("scheduled_for", { ascending: true })
        .limit(3);

      if (!scheduled || scheduled.length === 0)
        return "No scheduled emails to cancel.";

      const list = scheduled.map((s, i) => {
        const payload = s.payload as Record<string, unknown>;
        const subject = (payload?.subject as string) || "(no subject)";
        const when = new Date(s.scheduled_for).toLocaleString();
        return `${i + 1}. "${subject}" — scheduled for ${when}`;
      }).join("\n");

      return `📅 Scheduled emails:\n\n${list}\n\nManage them in the app:\n👉 ${APP_URL}/inbox`;
    }

    case "unknown":
    default:
      return WELCOME_MESSAGE;
  }
}

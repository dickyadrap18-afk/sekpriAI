import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Send high-priority notification to a user's bound Telegram chat.
 * Ref: specs/007-telegram-whatsapp-spec.md §7
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function notifyHighPriority(params: {
  userId: string;
  messageId: string;
  from: string;
  subject: string;
  summary: string;
}): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;

  const supabase = getServiceClient();

  // Check if user has a bound Telegram chat
  const { data: binding } = await supabase
    .from("telegram_bindings")
    .select("telegram_chat_id")
    .eq("user_id", params.userId)
    .not("telegram_chat_id", "is", null)
    .single();

  if (!binding?.telegram_chat_id) return false;

  // Check deduplication: don't notify twice for same message
  const { data: existing } = await supabase
    .from("ai_actions")
    .select("id")
    .eq("user_id", params.userId)
    .eq("feature", "telegram_notify")
    .contains("input", { message_id: params.messageId })
    .single();

  if (existing) return false;

  // Send notification
  const text = `🔴 High priority email\nFrom: ${params.from}\nSubject: ${params.subject}\n\n${params.summary}`;

  const res = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: binding.telegram_chat_id,
      text,
      parse_mode: "HTML",
    }),
  });

  // Log the notification
  await supabase.from("ai_actions").insert({
    user_id: params.userId,
    feature: "telegram_notify",
    input: { message_id: params.messageId },
    output: { sent: res.ok },
    model: null,
  });

  return res.ok;
}

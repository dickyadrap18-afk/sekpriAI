import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { handleCommand, WELCOME_MESSAGE } from "@/features/channels/server/router";

/**
 * Telegram Bot webhook endpoint.
 * URL: /api/telegram/webhook/<TELEGRAM_WEBHOOK_SECRET>
 * Ref: specs/007-telegram-whatsapp-spec.md §2, §9
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendTelegramMessage(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  // Validate webhook secret
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update = await request.json();
  const message = update?.message;

  if (!message?.text || !message?.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const telegramUserId = String(message.from?.id || "");
  const text = message.text.trim();
  const supabase = getServiceClient();

  // Handle /start <binding_code>
  if (text.startsWith("/start")) {
    const bindingCode = text.replace("/start", "").trim();

    if (!bindingCode) {
      await sendTelegramMessage(chatId, "Please use the binding code from the app. Example: /start ABC12345");
      return NextResponse.json({ ok: true });
    }

    // Look up binding code
    const { data: binding } = await supabase
      .from("telegram_bindings")
      .select("*")
      .eq("binding_code", bindingCode)
      .is("telegram_user_id", null)
      .single();

    if (!binding) {
      await sendTelegramMessage(chatId, "Invalid or expired binding code. Please generate a new one from the app.");
      return NextResponse.json({ ok: true });
    }

    // Bind the user
    await supabase
      .from("telegram_bindings")
      .update({
        telegram_user_id: telegramUserId,
        telegram_chat_id: chatId,
        bound_at: new Date().toISOString(),
      })
      .eq("id", binding.id);

    await sendTelegramMessage(chatId, WELCOME_MESSAGE);
    return NextResponse.json({ ok: true });
  }

  // For all other messages, find the bound user
  const { data: binding } = await supabase
    .from("telegram_bindings")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .not("bound_at", "is", null)
    .single();

  if (!binding) {
    await sendTelegramMessage(chatId, "You are not connected to sekpriAI. Use /start <code> to connect.");
    return NextResponse.json({ ok: true });
  }

  // Route the command
  const response = await handleCommand(binding.user_id, text);
  await sendTelegramMessage(chatId, response);

  return NextResponse.json({ ok: true });
}

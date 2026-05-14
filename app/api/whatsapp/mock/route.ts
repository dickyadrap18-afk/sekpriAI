import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { handleCommand } from "@/features/channels/server/router";

/**
 * WhatsApp mock command endpoint.
 * Same command parser as Telegram, no real WhatsApp API.
 * Ref: specs/007-telegram-whatsapp-spec.md §8
 */

const schema = z.object({
  message: z.string().min(1),
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

  const response = await handleCommand(user.id, parsed.data.message);

  return NextResponse.json({ response });
}

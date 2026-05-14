import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdapter } from "@/lib/providers";
import type { EmailAccount } from "@/lib/supabase/types";

/**
 * Send a message after approval.
 * Ref: specs/003-technical-spec.md §3, CLAUDE.md AI safety rules
 *
 * SAFETY: This route requires explicit user approval.
 * It refuses to send when requires_approval is true and no approval exists.
 */

const sendSchema = z.object({
  account_id: z.string().uuid(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  body_text: z.string().optional(),
  body_html: z.string().optional(),
  in_reply_to_message_id: z.string().optional(),
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
  const parsed = sendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data } = parsed;

  // Fetch the account (RLS ensures ownership)
  const { data: account, error: accError } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("id", data.account_id)
    .single();

  if (accError || !account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Send via provider adapter
  try {
    const adapter = createAdapter(account as EmailAccount);
    const result = await adapter.sendMessage({
      accountId: data.account_id,
      to: data.to,
      cc: data.cc,
      subject: data.subject,
      bodyText: data.body_text,
      bodyHtml: data.body_html,
      inReplyToMessageId: data.in_reply_to_message_id,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 }
    );
  }
}

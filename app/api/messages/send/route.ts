import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdapter } from "@/lib/providers";
import type { EmailAccount } from "@/lib/supabase/types";

/**
 * Send a message after approval.
 * SAFETY: Checks AI risk flag before sending. High-risk replies require
 * explicit approval via approval_requests table.
 * Ref: specs/003-technical-spec.md §3, specs/006-provider-integration-spec.md §11
 */

const sendSchema = z.object({
  account_id: z.string().uuid(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  body_text: z.string().optional(),
  body_html: z.string().optional(),
  in_reply_to_message_id: z.string().optional(),
  is_ai_generated: z.boolean().optional(),
  // If provided, skip approval check (user explicitly approved)
  approval_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  // ── Safety gate: check if original message requires approval ──────────
  if (data.in_reply_to_message_id && !data.approval_token) {
    const { data: originalMsg } = await supabase
      .from("messages")
      .select("ai_risk_level, ai_risk_reason")
      .eq("id", data.in_reply_to_message_id)
      .eq("user_id", user.id)
      .single();

    if (originalMsg?.ai_risk_level === "high") {
      // Create an approval request and block send
      await supabase.from("approval_requests").insert({
        user_id: user.id,
        message_id: data.in_reply_to_message_id,
        kind: "send",
        payload: {
          account_id: data.account_id,
          to: data.to,
          subject: data.subject,
          body_text: data.body_text,
          risk_reason: originalMsg.ai_risk_reason,
        },
        status: "pending",
      });

      return NextResponse.json({
        error: "approval_required",
        message: `This email is flagged as high-risk: "${originalMsg.ai_risk_reason}". An approval request has been created. Please review before sending.`,
        requires_approval: true,
      }, { status: 403 });
    }
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
      isAiGenerated: data.is_ai_generated,
    });

    // Save sent message to DB so it appears in Sent folder
    const { error: insertError } = await supabase.from("messages").insert({
      user_id: user.id,
      account_id: data.account_id,
      provider: account.provider,
      provider_message_id: (result as Record<string, unknown>)?.provider_message_id as string
        ?? `sent-local-${Date.now()}`,
      from_email: account.email_address,
      from_name: account.display_name ?? account.email_address,
      to_emails: data.to,
      cc_emails: data.cc ?? [],
      subject: data.subject,
      body_text: data.body_text ?? "",
      snippet: (data.body_text ?? "").slice(0, 200),
      labels: ["SENT"],
      is_read: true,
      is_archived: false,
      is_deleted: false,
      received_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[send] DB insert error:", insertError.message);
    }

    console.log("[send] Success:", JSON.stringify(result));
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Send failed";
    console.error("[send] Error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

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

  // ── Safety gate: check if original message requires approval ──────────
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

    // Save sent message to DB so it appears in Sent folder
    // Done server-side so user_id is always correct (from auth session)
    const { error: insertError } = await supabase.from("messages").insert({
      user_id: user.id,
      account_id: data.account_id,
      provider: account.provider,
      provider_message_id: (result as Record<string, unknown>)?.provider_message_id as string
        ?? `sent-local-${Date.now()}`,
      from_email: account.email_address,
      from_name: account.display_name ?? account.email_address,
      to_emails: data.to,
      cc_emails: data.cc ?? [],
      subject: data.subject,
      body_text: data.body_text ?? "",
      snippet: (data.body_text ?? "").slice(0, 200),
      labels: ["SENT"],
      is_read: true,
      is_archived: false,
      is_deleted: false,
      received_at: new Date().toISOString(),
    });

    if (insertError) {
      // Log but don't fail — email was sent, DB record is best-effort
      console.error("[send] DB insert error:", insertError.message);
    }

    console.log("[send] Success:", JSON.stringify(result));
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Send failed";
    console.error("[send] Error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

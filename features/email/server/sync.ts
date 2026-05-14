import "server-only";

import { getServiceClient } from "@/lib/supabase/service";
import { createAdapter } from "@/lib/providers";
import { processUnprocessedMessages } from "@/features/ai/server/process";
import { indexContent } from "@/features/rag/server/index";
import { extractText } from "@/features/rag/server/extract";
import type { EmailAccount } from "@/lib/supabase/types";
import type { NormalizedMessage } from "@/lib/providers/types";

/**
 * Server-only sync module.
 * Uses service role client to upsert messages for any user.
 * Ref: specs/006-provider-integration-spec.md §5
 */

export async function syncAccount(account: EmailAccount): Promise<number> {
  const adapter = createAdapter(account);
  const supabase = getServiceClient();

  const since = account.last_synced_at
    ? new Date(account.last_synced_at)
    : undefined;

  let messages: NormalizedMessage[];

  try {
    messages = await adapter.syncMessages({
      accountId: account.id,
      since,
    });
  } catch (err) {
    // Mark account as needing reconnection
    const status =
      err instanceof Error && err.message.includes("token")
        ? "auth_required"
        : "error";

    await supabase
      .from("email_accounts")
      .update({ sync_status: status })
      .eq("id", account.id);

    throw err;
  }

  // Upsert messages and handle attachments
  for (const msg of messages) {
    const { data: upserted } = await supabase.from("messages").upsert(
      {
        user_id: account.user_id,
        account_id: account.id,
        provider: account.provider,
        provider_message_id: msg.providerMessageId,
        provider_thread_id: msg.providerThreadId || null,
        thread_id: msg.providerThreadId || null,
        from_name: msg.fromName || null,
        from_email: msg.fromEmail,
        to_emails: msg.toEmails,
        cc_emails: msg.ccEmails,
        subject: msg.subject || null,
        body_text: msg.bodyText || null,
        body_html: msg.bodyHtml || null,
        snippet: msg.snippet || null,
        received_at: msg.receivedAt.toISOString(),
        labels: msg.labels,
      },
      { onConflict: "account_id,provider_message_id" }
    ).select("id").single();

    // ── Attachment RAG indexing ──────────────────────────────────────────
    // Index attachments (PDF, TXT, DOCX) into pgvector for RAG retrieval
    if (upserted?.id && msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (!att.content) continue;
        const ext = att.filename.split(".").pop()?.toLowerCase() ?? "";
        if (!["pdf", "txt", "docx", "doc"].includes(ext)) continue;

        try {
          const text = await extractText(att.content, att.mimeType || "application/octet-stream", att.filename);
          if (text && text.length > 50) {
            await indexContent({
              userId: account.user_id,
              sourceType: "attachment",
              sourceId: upserted.id,
              text: `[Attachment: ${att.filename}]\n\n${text}`,
            });

            // Store attachment metadata
            await supabase.from("attachments").upsert({
              user_id: account.user_id,
              message_id: upserted.id,
              provider_attachment_id: att.providerAttachmentId || att.filename,
              filename: att.filename,
              mime_type: att.mimeType,
              size_bytes: att.sizeBytes,
              extracted_text: text.slice(0, 10000), // store first 10k chars
            }, { onConflict: "message_id,provider_attachment_id" });
          }
        } catch {
          // Attachment indexing failure is non-fatal
        }
      }
    }
  }

  // Update last_synced_at
  await supabase
    .from("email_accounts")
    .update({
      last_synced_at: new Date().toISOString(),
      sync_status: "idle",
    })
    .eq("id", account.id);

  return messages.length;
}

export async function syncAllAccounts(): Promise<{
  synced: number;
  errors: string[];
}> {
  const supabase = getServiceClient();

  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("*")
    .neq("sync_status", "auth_required");

  if (!accounts || accounts.length === 0) {
    return { synced: 0, errors: [] };
  }

  let synced = 0;
  const errors: string[] = [];

  for (const account of accounts as EmailAccount[]) {
    try {
      const count = await syncAccount(account);
      synced += count;
    } catch (err) {
      errors.push(
        `${account.email_address}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // After all accounts synced, process unprocessed messages with AI
  try {
    await processUnprocessedMessages();
  } catch (err) {
    // AI processing failure is non-fatal
    errors.push(`AI processing: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { synced, errors };
}

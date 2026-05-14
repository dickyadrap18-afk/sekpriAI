import "server-only";

import { createClient } from "@supabase/supabase-js";
import { createAdapter } from "@/lib/providers";
import type { EmailAccount } from "@/lib/supabase/types";

/**
 * Approval service for scheduled emails.
 * Ref: specs/009-implementation-timeline.md Phase 8
 *
 * SAFETY: Emails only send when status='approved' AND scheduled_for <= now().
 */

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function flushDueScheduledEmails(): Promise<{
  sent: number;
  errors: string[];
}> {
  const supabase = getServiceClient();

  const { data: dueEmails } = await supabase
    .from("scheduled_emails")
    .select("*, email_accounts(*)")
    .eq("status", "approved")
    .lte("scheduled_for", new Date().toISOString())
    .is("sent_at", null);

  if (!dueEmails || dueEmails.length === 0) {
    return { sent: 0, errors: [] };
  }

  let sent = 0;
  const errors: string[] = [];

  for (const scheduled of dueEmails) {
    const account = scheduled.email_accounts as EmailAccount | null;
    if (!account) {
      errors.push(`${scheduled.id}: no account found`);
      await supabase
        .from("scheduled_emails")
        .update({ status: "failed", error_text: "Account not found" })
        .eq("id", scheduled.id);
      continue;
    }

    try {
      const adapter = createAdapter(account);
      await adapter.sendMessage({
        accountId: account.id,
        ...scheduled.payload,
      });

      await supabase
        .from("scheduled_emails")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", scheduled.id);

      sent++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push(`${scheduled.id}: ${errorMsg}`);
      await supabase
        .from("scheduled_emails")
        .update({ status: "failed", error_text: errorMsg })
        .eq("id", scheduled.id);
    }
  }

  return { sent, errors };
}

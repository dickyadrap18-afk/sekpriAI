import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAccount } from "@/features/email/server/sync";
import type { EmailAccount } from "@/lib/supabase/types";

/**
 * Manual sync trigger for the authenticated user's accounts.
 * Called from the inbox toolbar "Refresh" button.
 * Only syncs accounts belonging to the current user (RLS enforced).
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: accounts, error } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("user_id", user.id)
    .neq("sync_status", "auth_required");

  if (error || !accounts?.length) {
    return NextResponse.json({ synced: 0, errors: [] });
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

  return NextResponse.json({ synced, errors });
}

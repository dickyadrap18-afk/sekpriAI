import { createClient } from "@/lib/supabase/server";
import { SettingsView } from "@/features/settings/components/settings-view";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("id, provider, email_address, display_name, sync_status, last_synced_at, created_at")
    .order("created_at", { ascending: true });

  return <SettingsView initialAccounts={accounts ?? []} />;
}

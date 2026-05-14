"use client";

import { useState } from "react";
import { Mail, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { ConnectImapDialog } from "./connect-imap-dialog";
import { ProviderIcon } from "./provider-icon";
import { showToast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface AccountRow {
  id: string;
  provider: string;
  email_address: string;
  display_name: string | null;
  sync_status: string;
  last_synced_at: string | null;
  created_at: string;
}

interface SettingsViewProps {
  initialAccounts: AccountRow[];
}

function SyncStatusBadge({ status }: { status: string }) {
  if (status === "syncing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Syncing
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs text-red-400">
        <AlertCircle className="h-3 w-3" />
        Error
      </span>
    );
  }
  if (status === "idle") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.1] px-2 py-0.5 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      {status}
    </span>
  );
}

function formatLastSynced(dateStr: string | null): string {
  if (!dateStr) return "Never synced";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function SettingsView({ initialAccounts }: SettingsViewProps) {
  const [accounts, setAccounts] = useState<AccountRow[]>(initialAccounts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Remove this account? This will also delete all synced messages.")) return;
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("email_accounts").delete().eq("id", id);
    if (error) {
      showToast("Failed to remove account", "error");
    } else {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      showToast("Account removed", "success");
    }
    setDeletingId(null);
  }

  function handleConnected(account: AccountRow) {
    setAccounts((prev) => [...prev, account]);
    setDialogOpen(false);
    showToast(`${account.email_address} connected`, "success");
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your connected email accounts and preferences.
        </p>
      </div>

      {/* Connected Accounts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Connected Accounts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add email accounts to sync into your unified inbox.
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Account
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.1] p-8 text-center space-y-2">
            <Mail className="h-8 w-8 mx-auto text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No accounts connected</p>
            <p className="text-xs text-muted-foreground/70">
              Connect an IMAP/SMTP account to start syncing emails.
            </p>
            <button
              onClick={() => setDialogOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Connect your first account
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.07] divide-y divide-white/[0.05] overflow-hidden">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <ProviderIcon provider={account.provider} emailAddress={account.email_address} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {account.display_name || account.email_address}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">{account.email_address}</p>
                    <span className="text-muted-foreground/30">·</span>
                    <p className="text-xs text-muted-foreground/60 flex-shrink-0">{formatLastSynced(account.last_synced_at)}</p>
                  </div>
                </div>
                <SyncStatusBadge status={account.sync_status} />
                <button
                  onClick={() => handleDelete(account.id)}
                  disabled={deletingId === account.id}
                  className={cn(
                    "rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors",
                    deletingId === account.id && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label={`Remove ${account.email_address}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Connect IMAP dialog */}
      <ConnectImapDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConnected={handleConnected}
      />
    </div>
  );
}

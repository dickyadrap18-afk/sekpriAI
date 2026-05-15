"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  if (status === "syncing") return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa" }}>
      <RefreshCw className="h-3 w-3 animate-spin" /> Syncing
    </span>
  );
  if (status === "error") return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
      <AlertCircle className="h-3 w-3" /> Error
    </span>
  );
  if (status === "idle") return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
      <CheckCircle2 className="h-3 w-3" /> Connected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>
      <Clock className="h-3 w-3" /> {status}
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
  const searchParams = useSearchParams();

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "gmail_connected") {
      showToast("Gmail connected successfully", "success");
      // Reload accounts to show the new one
      loadAccounts();
    } else if (error) {
      const messages: Record<string, string> = {
        gmail_auth_failed: "Gmail authentication failed. Please try again.",
        gmail_token_exchange_failed: "Failed to exchange Gmail token. Please try again.",
        gmail_auth_invalid_state: "Invalid OAuth state. Please try again.",
      };
      showToast(messages[error] || "Connection failed", "error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAccounts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("email_accounts")
      .select("id, provider, email_address, display_name, sync_status, last_synced_at, created_at")
      .order("created_at", { ascending: true });
    if (data) setAccounts(data as AccountRow[]);
  }

  // Load accounts on mount
  useEffect(() => { loadAccounts(); }, []);

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
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-white/35">Manage your connected email accounts and preferences.</p>
      </div>

      {/* Connected Accounts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white/80">Connected Accounts</h2>
            <p className="text-xs text-white/30 mt-0.5">Add email accounts to sync into your unified inbox.</p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)" }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Account
          </button>
        </div>

        {/* OAuth quick-connect buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href="/api/auth/connect/gmail"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Gmail SVG */}
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="16" fill="#fff"/>
              <path d="M5 10.5v11A1.5 1.5 0 0 0 6.5 23h19A1.5 1.5 0 0 0 27 21.5v-11L16 18 5 10.5Z" fill="#EA4335"/>
              <path d="M5 10.5 16 18l11-7.5V9A1.5 1.5 0 0 0 25.5 7.5h-19A1.5 1.5 0 0 0 5 9v1.5Z" fill="#FBBC05"/>
              <path d="M5 10.5V9A1.5 1.5 0 0 1 6.5 7.5H16v10.5L5 10.5Z" fill="#34A853"/>
              <path d="M27 10.5V9A1.5 1.5 0 0 0 25.5 7.5H16v10.5l11-7.5Z" fill="#4285F4"/>
            </svg>
            <span className="text-white/70">Connect Gmail</span>
            <span className="ml-auto text-[10px] text-white/25">OAuth</span>
          </a>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Mail className="h-5 w-5 text-white/30" />
            <span className="text-white/70">IMAP / Other</span>
            <span className="ml-auto text-[10px] text-white/25">Password</span>
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl p-10 text-center space-y-3"
            style={{ border: "1px dashed rgba(201,169,110,0.15)", background: "rgba(201,169,110,0.02)" }}>
            <div className="h-12 w-12 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.12)" }}>
              <Mail className="h-5 w-5 text-[#c9a96e]/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/40">No accounts connected</p>
              <p className="text-xs text-white/20 mt-0.5">Connect an IMAP/SMTP account to start syncing emails.</p>
            </div>
            <button
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#c9a96e]/60 hover:text-[#c9a96e] transition-colors"
              style={{ border: "1px solid rgba(201,169,110,0.15)" }}
            >
              <Plus className="h-3.5 w-3.5" />
              Connect your first account
            </button>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(201,169,110,0.08)" }}>
            {accounts.map((account, i) => (
              <div
                key={account.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.04)" } : {}}
              >
                <ProviderIcon provider={account.provider} emailAddress={account.email_address} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/85 truncate">
                    {account.display_name || account.email_address}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-white/30 truncate">{account.email_address}</p>
                    <span className="text-white/15">·</span>
                    <p className="text-xs text-white/20 flex-shrink-0">{formatLastSynced(account.last_synced_at)}</p>
                  </div>
                </div>
                <SyncStatusBadge status={account.sync_status} />
                <button
                  onClick={() => handleDelete(account.id)}
                  disabled={deletingId === account.id}
                  className={cn(
                    "rounded-lg p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors",
                    deletingId === account.id && "opacity-40 cursor-not-allowed"
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

      <ConnectImapDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConnected={handleConnected}
      />

      {/* AI Provider Status */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-white/80">AI Provider</h2>
          <p className="text-xs text-white/30 mt-0.5">Active AI model used for summaries, drafts, and analysis.</p>
        </div>
        <div className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ border: "1px solid rgba(201,169,110,0.08)", background: "rgba(201,169,110,0.02)" }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)" }}>
            <span className="text-sm">🤖</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80 capitalize">
              Gemini 2.0 Flash
            </p>
            <p className="text-xs text-white/25 mt-0.5">
              Configured via <code className="text-[#c9a96e]/50">AI_PROVIDER</code> environment variable
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium flex-shrink-0"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
            Active
          </span>
        </div>
      </section>
    </div>
  );
}

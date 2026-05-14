"use client";

import type { EmailAccount } from "@/lib/supabase/types";

interface AccountSwitcherProps {
  accounts: EmailAccount[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
}

export function AccountSwitcher({
  accounts,
  selectedId,
  onSelect,
}: AccountSwitcherProps) {
  if (accounts.length === 0) return null;

  return (
    <select
      value={selectedId || "all"}
      onChange={(e) =>
        onSelect(e.target.value === "all" ? undefined : e.target.value)
      }
      className="flex h-8 rounded-lg px-2 py-1 text-xs text-white/50 hover:text-white/80 transition-colors cursor-pointer focus:outline-none"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      aria-label="Filter by account"
    >
      <option value="all">All accounts</option>
      {accounts.map((acc) => (
        <option key={acc.id} value={acc.id}>
          {acc.display_name || acc.email_address}
        </option>
      ))}
    </select>
  );
}

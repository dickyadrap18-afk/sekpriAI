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
      className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
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

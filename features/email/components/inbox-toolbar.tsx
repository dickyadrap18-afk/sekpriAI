"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tag, SlidersHorizontal, X, Search, RefreshCw, Check } from "lucide-react";
import { AccountSwitcher } from "./account-switcher";
import type { InboxFilters, EmailAccount } from "../types";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/toast";

interface InboxToolbarProps {
  filters: InboxFilters;
  onFiltersChange: (f: InboxFilters) => void;
  accounts: EmailAccount[];
  onRefresh?: () => void;
}

const PRIORITY_OPTIONS = [
  { value: "high",   label: "High",   dot: "bg-red-400" },
  { value: "medium", label: "Medium", dot: "bg-amber-400" },
  { value: "low",    label: "Low",    dot: "bg-slate-500" },
] as const;

const COMMON_LABELS = ["INBOX", "IMPORTANT", "NEWSLETTER", "SENT", "STARRED"];

const DROPDOWN_STYLE: React.CSSProperties = {
  position: "fixed",
  background: "rgba(14,12,22,0.98)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(201,169,110,0.15)",
  boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
  borderRadius: 10,
  zIndex: 99999,
};

export function InboxToolbar({ filters, onFiltersChange, accounts, onRefresh }: InboxToolbarProps) {
  const [showPriority, setShowPriority] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState(filters.search || "");
  const [syncing, setSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const priorityBtnRef = useRef<HTMLButtonElement>(null);
  const labelBtnRef = useRef<HTMLButtonElement>(null);
  const priorityDropRef = useRef<HTMLDivElement>(null);
  const labelDropRef = useRef<HTMLDivElement>(null);
  const [priorityPos, setPriorityPos] = useState({ x: 0, y: 0 });
  const [labelPos, setLabelPos] = useState({ x: 0, y: 0 });

  useEffect(() => { setMounted(true); }, []);

  // Close dropdowns on outside click — must exclude the dropdown portal itself
  useEffect(() => {
    if (!showPriority && !showLabel) return;
    function handle(e: MouseEvent) {
      const t = e.target as Node;
      if (priorityBtnRef.current?.contains(t)) return;
      if (labelBtnRef.current?.contains(t)) return;
      if (priorityDropRef.current?.contains(t)) return;
      if (labelDropRef.current?.contains(t)) return;
      setShowPriority(false);
      setShowLabel(false);
    }
    // Use 'mousedown' but with a tiny delay so item onClick fires first
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handle);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handle);
    };
  }, [showPriority, showLabel]);

  function handleSearch(val: string) {
    setSearchVal(val);
    onFiltersChange({ ...filters, search: val || undefined });
  }

  function openPriority() {
    if (priorityBtnRef.current) {
      const r = priorityBtnRef.current.getBoundingClientRect();
      setPriorityPos({ x: r.left, y: r.bottom + 4 });
    }
    setShowPriority((v) => !v);
    setShowLabel(false);
  }

  function openLabel() {
    if (labelBtnRef.current) {
      const r = labelBtnRef.current.getBoundingClientRect();
      setLabelPos({ x: r.left, y: r.bottom + 4 });
    }
    setShowLabel((v) => !v);
    setShowPriority(false);
  }

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/accounts/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      showToast(data.synced > 0 ? `Synced ${data.synced} new message${data.synced > 1 ? "s" : ""}` : "Inbox is up to date", "success");
      onRefresh?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  }

  const activeFiltersCount = [filters.priority, filters.label].filter(Boolean).length;

  return (
    <div style={{ borderBottom: "1px solid rgba(201,169,110,0.07)" }}>
      {/* Row 1: Search + Refresh */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2"
        style={{ background: "linear-gradient(180deg, rgba(201,169,110,0.03) 0%, transparent 100%)" }}>
        <div className={cn(
          "flex flex-1 items-center gap-2 rounded-lg border px-3 h-8 transition-all duration-200",
          searchFocused ? "border-[#c9a96e]/30 bg-[#c9a96e]/[0.04]" : "border-white/[0.07] bg-white/[0.03]"
        )}>
          <Search className={cn("h-3.5 w-3.5 flex-shrink-0 transition-colors", searchFocused ? "text-[#c9a96e]/60" : "text-white/20")} />
          <input
            type="text" value={searchVal}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search..."
            className="flex-1 min-w-0 bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none"
          />
          {searchVal && (
            <button onClick={() => handleSearch("")} className="flex-shrink-0 text-white/20 hover:text-white/50 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          onClick={handleSync} disabled={syncing}
          className="flex-shrink-0 flex items-center justify-center rounded-lg h-8 w-8 transition-all hover:bg-white/[0.06] disabled:opacity-40"
          style={{ border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}
          title="Sync inbox" aria-label="Sync inbox"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
        </button>
      </div>

      {/* Row 2: Account + Filters */}
      <div className="flex items-center gap-1.5 px-3 pb-2">
        {accounts.length > 0 && (
          <AccountSwitcher
            accounts={accounts}
            selectedId={filters.account_id ?? undefined}
            onSelect={(id) => onFiltersChange({ ...filters, account_id: id })}
          />
        )}

        <div className="flex items-center gap-1 ml-auto">
          {/* Priority */}
          <button
            ref={priorityBtnRef}
            onClick={openPriority}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 h-7 text-xs transition-all",
              filters.priority
                ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.08] text-[#c9a96e]"
                : "border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/[0.12]"
            )}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span className="text-[11px]">{filters.priority ?? "Priority"}</span>
          </button>

          {/* Label */}
          <button
            ref={labelBtnRef}
            onClick={openLabel}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 h-7 text-xs transition-all",
              filters.label
                ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.08] text-[#c9a96e]"
                : "border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/[0.12]"
            )}
          >
            <Tag className="h-3 w-3" />
            <span className="text-[11px]">{filters.label ?? "Label"}</span>
          </button>
        </div>
      </div>

      {/* Active chips */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 pb-2">
          {filters.priority && (
            <button onClick={() => onFiltersChange({ ...filters, priority: undefined })}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
              style={{ border: "1px solid rgba(201,169,110,0.2)", background: "rgba(201,169,110,0.06)", color: "rgba(201,169,110,0.7)" }}>
              {filters.priority} <X className="h-2.5 w-2.5" />
            </button>
          )}
          {filters.label && (
            <button onClick={() => onFiltersChange({ ...filters, label: undefined })}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
              style={{ border: "1px solid rgba(201,169,110,0.2)", background: "rgba(201,169,110,0.06)", color: "rgba(201,169,110,0.7)" }}>
              {filters.label} <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      )}

      {/* Priority dropdown — portal */}
      {mounted && showPriority && createPortal(
        <div ref={priorityDropRef} style={{ ...DROPDOWN_STYLE, left: priorityPos.x, top: priorityPos.y, width: 144 }} className="py-1">
          {filters.priority && (
            <button onClick={() => { onFiltersChange({ ...filters, priority: undefined }); setShowPriority(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          {PRIORITY_OPTIONS.map((opt) => (
            <button key={opt.value}
              onClick={() => { onFiltersChange({ ...filters, priority: opt.value }); setShowPriority(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/[0.06]">
              <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", opt.dot)} />
              <span className={filters.priority === opt.value ? "text-white font-medium" : "text-white/60"}>{opt.label}</span>
              {filters.priority === opt.value && <Check className="h-3 w-3 text-[#c9a96e] ml-auto" />}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Label dropdown — portal */}
      {mounted && showLabel && createPortal(
        <div ref={labelDropRef} style={{ ...DROPDOWN_STYLE, left: labelPos.x, top: labelPos.y, width: 160 }} className="py-1">
          {filters.label && (
            <button onClick={() => { onFiltersChange({ ...filters, label: undefined }); setShowLabel(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          {COMMON_LABELS.map((label) => (
            <button key={label}
              onClick={() => { onFiltersChange({ ...filters, label }); setShowLabel(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/[0.06]">
              <span className="h-1.5 w-1.5 rounded-full bg-white/20 flex-shrink-0" />
              <span className={filters.label === label ? "text-white font-medium" : "text-white/60"}>{label}</span>
              {filters.label === label && <Check className="h-3 w-3 text-[#c9a96e] ml-auto" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

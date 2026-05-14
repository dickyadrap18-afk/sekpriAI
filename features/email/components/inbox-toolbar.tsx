"use client";

import { useState } from "react";
import { Tag, SlidersHorizontal, X, Search, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

export function InboxToolbar({ filters, onFiltersChange, accounts, onRefresh }: InboxToolbarProps) {
  const [showPriority, setShowPriority] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState(filters.search || "");
  const [syncing, setSyncing] = useState(false);

  const activeFiltersCount = [filters.priority, filters.label].filter(Boolean).length;

  function handleSearch(val: string) {
    setSearchVal(val);
    onFiltersChange({ ...filters, search: val || undefined });
  }

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/accounts/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      const msg = data.synced > 0
        ? `Synced ${data.synced} new message${data.synced > 1 ? "s" : ""}`
        : "Inbox is up to date";
      showToast(msg, "success");
      onRefresh?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div style={{ borderBottom: "1px solid rgba(201,169,110,0.07)" }} className="relative z-10 overflow-visible">
      {/* Row 1: Search + Refresh */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2"
        style={{ background: "linear-gradient(180deg, rgba(201,169,110,0.03) 0%, transparent 100%)" }}>

        {/* Search */}
        <div className={cn(
          "flex flex-1 items-center gap-2 rounded-lg border px-3 h-8 transition-all duration-200",
          searchFocused
            ? "border-[#c9a96e]/30 bg-[#c9a96e]/[0.04]"
            : "border-white/[0.07] bg-white/[0.03]"
        )}>
          <Search className={cn(
            "h-3.5 w-3.5 flex-shrink-0 transition-colors",
            searchFocused ? "text-[#c9a96e]/60" : "text-white/20"
          )} />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search..."
            className="flex-1 min-w-0 bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none"
          />
          {searchVal && (
            <button onClick={() => handleSearch("")}
              className="flex-shrink-0 text-white/20 hover:text-white/50 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex-shrink-0 flex items-center justify-center rounded-lg h-8 w-8 transition-all hover:bg-white/[0.06] disabled:opacity-40"
          style={{ border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}
          title="Sync inbox"
          aria-label="Sync inbox"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
        </button>
      </div>

      {/* Row 2: Filters */}
      <div className="flex items-center gap-1.5 px-3 pb-2">
        {/* Account switcher */}
        {accounts.length > 0 && (
          <AccountSwitcher
            accounts={accounts}
            selectedId={filters.account_id}
            onSelect={(id) => onFiltersChange({ ...filters, account_id: id })}
          />
        )}

        <div className="flex items-center gap-1 ml-auto">
          {/* Priority filter */}
          <div className="relative">
            <button
              onClick={() => { setShowPriority(!showPriority); setShowLabel(false); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 h-7 text-xs transition-all",
                filters.priority
                  ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.08] text-[#c9a96e]"
                  : "border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/[0.12]"
              )}
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span className="text-[11px]">
                {filters.priority ? filters.priority : "Priority"}
              </span>
            </button>
            <AnimatePresence>
              {showPriority && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1.5 z-20 w-36 rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(8,8,16,0.97)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
                  }}
                >
                  <div className="p-1">
                    {filters.priority && (
                      <button onClick={() => { onFiltersChange({ ...filters, priority: undefined }); setShowPriority(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/30 hover:bg-white/[0.05] hover:text-white/60 transition-colors">
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button key={opt.value}
                        onClick={() => { onFiltersChange({ ...filters, priority: opt.value }); setShowPriority(false); }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors",
                          filters.priority === opt.value
                            ? "bg-white/[0.06] text-white"
                            : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                        )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", opt.dot)} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Label filter */}
          <div className="relative">
            <button
              onClick={() => { setShowLabel(!showLabel); setShowPriority(false); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 h-7 text-xs transition-all",
                filters.label
                  ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.08] text-[#c9a96e]"
                  : "border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/[0.12]"
              )}
            >
              <Tag className="h-3 w-3" />
              <span className="text-[11px]">
                {filters.label ? filters.label : "Label"}
              </span>
            </button>
            <AnimatePresence>
              {showLabel && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1.5 z-20 w-40 rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(8,8,16,0.97)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
                  }}
                >
                  <div className="p-1">
                    {filters.label && (
                      <button onClick={() => { onFiltersChange({ ...filters, label: undefined }); setShowLabel(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/30 hover:bg-white/[0.05] hover:text-white/60 transition-colors">
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                    {COMMON_LABELS.map((label) => (
                      <button key={label}
                        onClick={() => { onFiltersChange({ ...filters, label }); setShowLabel(false); }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors",
                          filters.label === label
                            ? "bg-white/[0.06] text-white"
                            : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                        )}>
                        <span className="h-1.5 w-1.5 rounded-full bg-white/20 flex-shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-1.5 px-3 pb-2 overflow-hidden"
          >
            {filters.priority && (
              <button onClick={() => onFiltersChange({ ...filters, priority: undefined })}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition-colors"
                style={{ border: "1px solid rgba(201,169,110,0.2)", background: "rgba(201,169,110,0.06)", color: "rgba(201,169,110,0.7)" }}>
                {filters.priority} <X className="h-2.5 w-2.5" />
              </button>
            )}
            {filters.label && (
              <button onClick={() => onFiltersChange({ ...filters, label: undefined })}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition-colors"
                style={{ border: "1px solid rgba(201,169,110,0.2)", background: "rgba(201,169,110,0.06)", color: "rgba(201,169,110,0.7)" }}>
                {filters.label} <X className="h-2.5 w-2.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

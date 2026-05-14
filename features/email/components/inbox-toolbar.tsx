"use client";

import { useState } from "react";
import { Plus, Tag, SlidersHorizontal, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountSwitcher } from "./account-switcher";
import type { InboxFilters } from "../types";
import type { EmailAccount } from "../types";
import { cn } from "@/lib/utils";

interface InboxToolbarProps {
  filters: InboxFilters;
  onFiltersChange: (f: InboxFilters) => void;
  accounts: EmailAccount[];
  onCompose: () => void;
}

const PRIORITY_OPTIONS = [
  { value: "high",   label: "High",   dot: "bg-red-400" },
  { value: "medium", label: "Medium", dot: "bg-amber-400" },
  { value: "low",    label: "Low",    dot: "bg-slate-500" },
] as const;

const COMMON_LABELS = ["INBOX", "IMPORTANT", "NEWSLETTER", "SENT", "STARRED"];

export function InboxToolbar({ filters, onFiltersChange, accounts, onCompose }: InboxToolbarProps) {
  const [showPriority, setShowPriority] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState(filters.search || "");

  const activeFiltersCount = [filters.priority, filters.label].filter(Boolean).length;

  function handleSearch(val: string) {
    setSearchVal(val);
    onFiltersChange({ ...filters, search: val || undefined });
  }

  return (
    <div>
      {/* Main toolbar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.05]"
        style={{ background: "linear-gradient(180deg, rgba(201,169,110,0.03) 0%, transparent 100%)" }}>

        {/* Search */}
        <div className={cn(
          "flex items-center gap-2 rounded-lg border px-3 h-8 transition-all duration-200 min-w-0",
          "w-full max-w-[200px] sm:max-w-xs",
          searchFocused
            ? "border-[#c9a96e]/30 bg-[#c9a96e]/[0.04]"
            : "border-white/[0.07] bg-white/[0.03]"
        )}>
          <Search className={cn("h-3.5 w-3.5 flex-shrink-0 transition-colors", searchFocused ? "text-[#c9a96e]/60" : "text-white/20")} />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none"
          />
          {searchVal && (
            <button onClick={() => handleSearch("")} className="text-white/20 hover:text-white/50 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          {accounts.length > 0 && (
            <AccountSwitcher
              accounts={accounts}
              selectedId={filters.account_id}
              onSelect={(id) => onFiltersChange({ ...filters, account_id: id })}
            />
          )}

          {/* Priority filter */}
          <div className="relative">
            <button
              onClick={() => { setShowPriority(!showPriority); setShowLabel(false); }}
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2 h-8 text-xs transition-all",
                filters.priority
                  ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.08] text-[#c9a96e]"
                  : "border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/[0.12]"
              )}
              title="Priority filter"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {showPriority && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 z-20 w-36 rounded-xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl overflow-hidden"
                  style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)" }}
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
                          filters.priority === opt.value ? "bg-white/[0.06] text-white" : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
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
                "flex items-center gap-1 rounded-lg border px-2 h-8 text-xs transition-all",
                filters.label
                  ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.08] text-[#c9a96e]"
                  : "border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/[0.12]"
              )}
              title="Label filter"
            >
              <Tag className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {showLabel && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 z-20 w-40 rounded-xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl overflow-hidden"
                  style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)" }}
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
                          filters.label === label ? "bg-white/[0.06] text-white" : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
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

          {/* Compose */}
          <button
            onClick={onCompose}
            className="flex items-center gap-1.5 rounded-lg h-8 px-3 text-xs font-semibold text-black transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)" }}
            title="Compose"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Compose</span>
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.04] overflow-hidden"
          >
            <span className="text-[10px] text-white/20 uppercase tracking-widest">Active:</span>
            {filters.priority && (
              <button onClick={() => onFiltersChange({ ...filters, priority: undefined })}
                className="inline-flex items-center gap-1 rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/[0.06] px-2 py-0.5 text-[11px] text-[#c9a96e]/70 hover:bg-[#c9a96e]/[0.12] transition-colors">
                {filters.priority} <X className="h-2.5 w-2.5" />
              </button>
            )}
            {filters.label && (
              <button onClick={() => onFiltersChange({ ...filters, label: undefined })}
                className="inline-flex items-center gap-1 rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/[0.06] px-2 py-0.5 text-[11px] text-[#c9a96e]/70 hover:bg-[#c9a96e]/[0.12] transition-colors">
                {filters.label} <X className="h-2.5 w-2.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Tag, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "./search-bar";
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
  { value: "high",   label: "High",   color: "text-red-400" },
  { value: "medium", label: "Medium", color: "text-amber-400" },
  { value: "low",    label: "Low",    color: "text-slate-400" },
] as const;

const COMMON_LABELS = ["INBOX", "IMPORTANT", "NEWSLETTER", "SENT", "STARRED"];

export function InboxToolbar({ filters, onFiltersChange, accounts, onCompose }: InboxToolbarProps) {
  const [showPriority, setShowPriority] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  const activeFiltersCount = [filters.priority, filters.label].filter(Boolean).length;

  return (
    <div className="space-y-0">
      {/* Main toolbar row */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
        {/* Search takes remaining space */}
        <div className="flex-1 min-w-0">
          <SearchBar
            value={filters.search || ""}
            onChange={(search) => onFiltersChange({ ...filters, search: search || undefined })}
          />
        </div>

        {/* Right side controls — always visible, never pushed out */}
        <div className="flex items-center gap-1 flex-shrink-0">
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
                "flex items-center gap-0.5 rounded-lg border p-1.5 text-xs transition-colors",
                filters.priority
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-white/[0.1] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
              )}
              aria-label="Filter by priority"
              title="Priority filter"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {showPriority && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border border-white/[0.1] bg-[#0a0a0a] shadow-xl overflow-hidden"
                >
                  <div className="p-1">
                    {filters.priority && (
                      <button
                        onClick={() => { onFiltersChange({ ...filters, priority: undefined }); setShowPriority(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { onFiltersChange({ ...filters, priority: opt.value }); setShowPriority(false); }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors",
                          filters.priority === opt.value ? opt.color + " font-semibold" : "text-muted-foreground"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0",
                          opt.value === "high" ? "bg-red-400" : opt.value === "medium" ? "bg-amber-400" : "bg-slate-400"
                        )} />
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
                "flex items-center gap-0.5 rounded-lg border p-1.5 text-xs transition-colors",
                filters.label
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-white/[0.1] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
              )}
              aria-label="Filter by label"
              title="Label filter"
            >
              <Tag className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {showLabel && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-20 w-40 rounded-xl border border-white/[0.1] bg-[#0a0a0a] shadow-xl overflow-hidden"
                >
                  <div className="p-1">
                    {filters.label && (
                      <button
                        onClick={() => { onFiltersChange({ ...filters, label: undefined }); setShowLabel(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                    {COMMON_LABELS.map((label) => (
                      <button
                        key={label}
                        onClick={() => { onFiltersChange({ ...filters, label }); setShowLabel(false); }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors",
                          filters.label === label ? "text-primary font-semibold" : "text-muted-foreground"
                        )}
                      >
                        <Tag className="h-3 w-3 flex-shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Compose — always last, always visible */}
          <button
            onClick={onCompose}
            className="rounded-lg bg-primary p-1.5 text-white hover:bg-primary/90 transition-all hover:shadow-[0_0_12px_rgba(99,102,241,0.5)]"
            aria-label="Compose new message"
            title="Compose"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.04]">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Filters:</span>
          {filters.priority && (
            <button
              onClick={() => onFiltersChange({ ...filters, priority: undefined })}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/20 transition-colors"
            >
              {filters.priority} <X className="h-2.5 w-2.5" />
            </button>
          )}
          {filters.label && (
            <button
              onClick={() => onFiltersChange({ ...filters, label: undefined })}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/20 transition-colors"
            >
              {filters.label} <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

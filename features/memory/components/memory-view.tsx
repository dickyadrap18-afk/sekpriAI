"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Trash2, BookMarked } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MemoryItem } from "@/lib/supabase/types";

type Tab = "pending" | "active" | "rejected";

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: "pending",  label: "Pending",  color: "text-amber-400" },
  { key: "active",   label: "Active",   color: "text-green-400" },
  { key: "rejected", label: "Rejected", color: "text-muted-foreground" },
];

export function MemoryView() {
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("memory_items")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false });
    setItems((data as MemoryItem[]) ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleAction(id: string, action: "approve" | "reject" | "delete") {
    await fetch(`/api/memory/${id}/${action}`, { method: "POST" });
    fetchItems();
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-white/[0.06]" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            role="tab" aria-selected={tab === t.key}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-all",
              tab === t.key
                ? `border-primary ${t.color}`
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div role="tabpanel">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-16 rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BookMarked className="h-5 w-5 text-primary/40" />
            </div>
            <p className="text-sm text-muted-foreground">No {tab} memory items</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-primary/70 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                      {item.memory_type}
                    </span>
                    {item.confidence && (
                      <span className="text-[11px] text-muted-foreground">
                        {Math.round(item.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1.5 text-foreground/85">{item.content}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  {tab === "pending" && (
                    <>
                      <button onClick={() => handleAction(item.id, "approve")}
                        className="rounded-lg p-1.5 text-green-400 hover:bg-green-500/10 transition-colors" aria-label="Approve">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleAction(item.id, "reject")}
                        className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/10 transition-colors" aria-label="Reject">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => handleAction(item.id, "delete")}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

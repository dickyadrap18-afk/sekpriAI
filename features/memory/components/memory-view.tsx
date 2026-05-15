"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Trash2, BookMarked, Pencil, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/toast";
import type { MemoryItem } from "@/lib/supabase/types";

type Tab = "pending" | "active" | "rejected";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending",  label: "Pending" },
  { key: "active",   label: "Active" },
  { key: "rejected", label: "Rejected" },
];

function SkeletonCard() {
  return (
    <div className="flex items-start gap-3 rounded-xl p-3.5 border border-white/[0.04]"
      style={{ background: "rgba(8,8,16,0.4)" }}>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded-full shimmer" />
        <div className="h-3 w-full rounded-full shimmer" />
        <div className="h-3 w-2/3 rounded-full shimmer" />
      </div>
      <div className="flex gap-1">
        <div className="h-7 w-7 rounded-lg shimmer" />
        <div className="h-7 w-7 rounded-lg shimmer" />
      </div>
    </div>
  );
}

export function MemoryView() {
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

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

  function startEdit(item: MemoryItem) {
    setEditingId(item.id);
    setEditContent(item.content);
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("memory_items")
      .update({ content: editContent.trim() })
      .eq("id", id);
    if (error) {
      showToast("Failed to save edit", "error");
    } else {
      setItems((prev) => prev.map((item) =>
        item.id === id ? { ...item, content: editContent.trim() } : item
      ));
      showToast("Memory updated", "success");
    }
    setEditingId(null);
  }

  const tabKeys: Tab[] = ["pending", "active", "rejected"];

  function handleTabKeyDown(e: React.KeyboardEvent, currentTab: Tab) {
    const idx = tabKeys.indexOf(currentTab);
    if (e.key === "ArrowRight") { e.preventDefault(); setTab(tabKeys[(idx + 1) % tabKeys.length]); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setTab(tabKeys[(idx - 1 + tabKeys.length) % tabKeys.length]); }
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-0.5" role="tablist" aria-label="Memory status filter"
        style={{ borderBottom: "1px solid rgba(201,169,110,0.08)" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            onKeyDown={(e) => handleTabKeyDown(e, t.key)}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`tabpanel-${t.key}`}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all",
              tab === t.key
                ? "border-[#c9a96e] text-[#c9a96e]"
                : "border-transparent text-white/30 hover:text-white/60"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-4 text-center"
          >
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(201,169,110,0.05)", border: "1px solid rgba(201,169,110,0.12)" }}>
                <BookMarked className="h-6 w-6 text-[#c9a96e]/30" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white/40">No {tab} memories</p>
              <p className="text-xs text-white/20 mt-0.5">
                {tab === "pending" ? "New memories will appear here for review" :
                 tab === "active" ? "Approved memories will show here" :
                 "Rejected memories are stored here"}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="flex items-start gap-3 rounded-xl p-3.5 transition-colors group"
                  style={{ background: "rgba(8,8,16,0.5)", border: "1px solid rgba(201,169,110,0.07)" }}
                  whileHover={{ borderColor: "rgba(201,169,110,0.14)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                        style={{ color: "#c9a96e", background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)" }}>
                        {item.memory_type}
                      </span>
                      {item.confidence && (
                        <span className="text-[11px] text-white/25">
                          {Math.round(item.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>

                    {editingId === item.id ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                        rows={3}
                        className="w-full rounded-lg border border-white/[0.15] bg-white/[0.04] px-3 py-2 text-sm text-white/85 resize-none focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit(item.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <p className="text-sm text-white/75 leading-relaxed">{item.content}</p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs text-white/20">
                        {new Date(item.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      {/* Link to source email */}
                      {item.source_message_id && (
                        <a
                          href={`/inbox?message=${item.source_message_id}`}
                          className="text-xs text-[#c9a96e]/40 hover:text-[#c9a96e]/70 transition-colors flex items-center gap-1"
                          title="View source email"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Source email
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    {editingId === item.id ? (
                      <>
                        <button onClick={() => saveEdit(item.id)}
                          className="rounded-lg p-1.5 text-[#c9a96e]/70 hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-colors"
                          aria-label="Save" title="Save (Ctrl+Enter)">
                          <Save className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="rounded-lg p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                          aria-label="Cancel">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(item)}
                        className="rounded-lg p-1.5 text-white/20 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                        aria-label="Edit" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}

                    {tab === "pending" && editingId !== item.id && (
                      <>
                        <button onClick={() => handleAction(item.id, "approve")}
                          className="rounded-lg p-1.5 text-green-400/70 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                          aria-label="Approve">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleAction(item.id, "reject")}
                          className="rounded-lg p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                          aria-label="Reject">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {editingId !== item.id && (
                      <button onClick={() => handleAction(item.id, "delete")}
                        className="rounded-lg p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

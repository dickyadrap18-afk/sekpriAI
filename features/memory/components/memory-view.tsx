"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemoryItem } from "@/lib/supabase/types";

type Tab = "pending" | "active" | "rejected";

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

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleAction(id: string, action: "approve" | "reject" | "delete") {
    await fetch(`/api/memory/${id}/${action}`, { method: "POST" });
    fetchItems();
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "active", label: "Active" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b" role="tablist" aria-label="Memory status filter">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            role="tab"
            aria-selected={tab === t.key}
            aria-controls={`tabpanel-${t.key}`}
            id={`tab-${t.key}`}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded-md" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No {tab} memory items.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {item.memory_type}
                  </span>
                  {item.confidence && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <p className="text-sm mt-1">{item.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              {tab === "pending" && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleAction(item.id, "approve")}
                    className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
                    aria-label="Approve"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "reject")}
                    className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
                    aria-label="Reject"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "delete")}
                    className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {tab === "active" && (
                <button
                  onClick={() => handleAction(item.id, "delete")}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50 flex-shrink-0"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

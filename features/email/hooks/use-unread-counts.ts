"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UnreadCounts {
  inbox: number;
  starred: number;
  important: number;
}

export function useUnreadCounts() {
  const [counts, setCounts] = useState<UnreadCounts>({ inbox: 0, starred: 0, important: 0 });
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  async function fetchCounts() {
    const supabase = createClient();

    const [inboxRes, starredRes, importantRes] = await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .eq("is_archived", false)
        .eq("is_deleted", false)
        .not("labels", "ov", "{SENT}")
        .not("labels", "ov", "{DRAFT}"),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .eq("is_deleted", false)
        .contains("labels", ["STARRED"]),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .eq("is_deleted", false)
        .contains("labels", ["IMPORTANT"]),
    ]);

    setCounts({
      inbox: inboxRes.count ?? 0,
      starred: starredRes.count ?? 0,
      important: importantRes.count ?? 0,
    });
  }

  useEffect(() => {
    fetchCounts();

    const supabase = createClient();
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel("unread-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchCounts();
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, []);

  return counts;
}

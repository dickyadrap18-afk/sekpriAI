"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { escapePostgrestLike } from "@/lib/utils/escape-postgrest";
import type { MessageListItem, InboxFilters } from "../types";

export const PAGE_SIZE = 10;

export function useInbox(filters: InboxFilters, page = 0) {
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchMessages = useCallback(async () => {
    const supabase = createClient();

    // Base filter depends on folder
    const folder = filters.folder ?? "inbox";

    let query = supabase
      .from("messages")
      .select(
        "id, from_name, from_email, subject, snippet, received_at, is_read, labels, ai_priority, provider, account_id",
        { count: "exact" }
      )
      .order("received_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    // Folder logic
    switch (folder) {
      case "inbox":
        query = query.eq("is_archived", false).eq("is_deleted", false);
        break;
      case "starred":
        query = query.contains("labels", ["STARRED"]).eq("is_deleted", false);
        break;
      case "important":
        query = query.contains("labels", ["IMPORTANT"]).eq("is_deleted", false);
        break;
      case "sent":
        query = query.contains("labels", ["SENT"]).eq("is_deleted", false);
        break;
      case "drafts":
        query = query.contains("labels", ["DRAFT"]).eq("is_deleted", false);
        break;
      case "archive":
        query = query.eq("is_archived", true).eq("is_deleted", false);
        break;
      case "trash":
        query = query.eq("is_deleted", true);
        break;
      default:
        query = query.eq("is_archived", false).eq("is_deleted", false);
    }

    if (filters.account_id) {
      query = query.eq("account_id", filters.account_id);
    }

    if (filters.search) {
      const escaped = escapePostgrestLike(filters.search);
      query = query.or(
        `subject.ilike.%${escaped}%,from_email.ilike.%${escaped}%,from_name.ilike.%${escaped}%,snippet.ilike.%${escaped}%`
      );
    }

    if (filters.label) {
      query = query.contains("labels", [filters.label]);
    }

    if (filters.priority) {
      query = query.eq("ai_priority", filters.priority);
    }

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setMessages([]);
      setTotal(0);
    } else {
      setError(null);
      // Sort: starred first, then by received_at desc
      const sorted = ((data as MessageListItem[]) ?? []).sort((a, b) => {
        const aStarred = (a.labels ?? []).includes("STARRED") ? 1 : 0;
        const bStarred = (b.labels ?? []).includes("STARRED") ? 1 : 0;
        if (bStarred !== aStarred) return bStarred - aStarred;
        return 0; // already ordered by received_at from DB
      });
      setMessages(sorted);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [filters.account_id, filters.search, filters.label, filters.priority, filters.folder, page]);

  useEffect(() => {
    setLoading(true);
    startTransition(() => {
      fetchMessages();
    });
  }, [fetchMessages]);

  const refetch = useCallback(() => {
    startTransition(() => {
      fetchMessages();
    });
  }, [fetchMessages]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return { messages, loading: loading || isPending, error, refetch, total, totalPages };
}

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { escapePostgrestLike } from "@/lib/utils/escape-postgrest";
import type { MessageListItem, InboxFilters } from "../types";

export function useInbox(filters: InboxFilters) {
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchMessages = useCallback(async () => {
    const supabase = createClient();

    let query = supabase
      .from("messages")
      .select(
        "id, from_name, from_email, subject, snippet, received_at, is_read, labels, ai_priority, provider, account_id"
      )
      .eq("is_archived", false)
      .eq("is_deleted", false)
      .order("received_at", { ascending: false })
      .limit(50);

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

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setMessages([]);
    } else {
      setError(null);
      setMessages((data as MessageListItem[]) ?? []);
    }
    setLoading(false);
  }, [filters.account_id, filters.search, filters.label, filters.priority]);

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

  return { messages, loading: loading || isPending, error, refetch };
}

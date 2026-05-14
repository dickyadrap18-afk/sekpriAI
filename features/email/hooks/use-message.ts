"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/supabase/types";

export function useMessage(messageId: string | null) {
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessage = useCallback(async () => {
    if (!messageId) {
      setMessage(null);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      setMessage(null);
    } else {
      setError(null);
      setMessage(data as Message);

      // Mark as read if not already
      if (data && !data.is_read) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("id", messageId);
      }
    }
    setLoading(false);
  }, [messageId]);

  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  return { message, loading, error, refetch: fetchMessage };
}

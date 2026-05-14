"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TelegramBinding() {
  const [bindingCode, setBindingCode] = useState<string | null>(null);
  const [isBound, setIsBound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data } = await supabase
        .from("telegram_bindings")
        .select("binding_code, bound_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.bound_at) {
        setIsBound(true);
      } else if (data?.binding_code) {
        setBindingCode(data.binding_code);
      }
      setLoading(false);
    }
    check();
  }, []);

  const generateCode = useCallback(async () => {
    const supabase = createClient();
    const code = Array.from(crypto.getRandomValues(new Uint8Array(5)))
      .map((b) => b.toString(36).toUpperCase().padStart(2, "0"))
      .join("")
      .slice(0, 8);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("telegram_bindings").insert({
      user_id: user.id,
      binding_code: code,
    });

    setBindingCode(code);
  }, []);

  if (loading) {
    return <div className="animate-pulse h-20 bg-muted rounded-md" />;
  }

  if (isBound) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800">
          ✅ Telegram connected
        </p>
        <p className="text-xs text-green-600 mt-1">
          You will receive high-priority email notifications via Telegram.
        </p>
      </div>
    );
  }

  if (bindingCode) {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm">
          Open Telegram and send this to the sekpriAI bot:
        </p>
        <code className="block rounded bg-muted px-3 py-2 text-sm font-mono">
          /start {bindingCode}
        </code>
        <p className="text-xs text-muted-foreground">
          Or click:{" "}
          <a
            href={`https://t.me/sekpriai_bot?start=${bindingCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary"
          >
            Open in Telegram
          </a>
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={generateCode}
      className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Connect Telegram
    </button>
  );
}

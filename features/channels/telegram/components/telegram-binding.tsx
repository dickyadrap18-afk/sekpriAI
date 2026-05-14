"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";

export function TelegramBinding() {
  const [bindingCode, setBindingCode] = useState<string | null>(null);
  const [isBound, setIsBound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data } = await supabase
        .from("telegram_bindings")
        .select("binding_code, bound_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data?.bound_at) setIsBound(true);
      else if (data?.binding_code) setBindingCode(data.binding_code);
      setLoading(false);
    }
    check();
  }, []);

  const generateCode = useCallback(async () => {
    setGenerating(true);
    const supabase = createClient();
    const code = Array.from(crypto.getRandomValues(new Uint8Array(5)))
      .map((b) => b.toString(36).toUpperCase().padStart(2, "0"))
      .join("")
      .slice(0, 8);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGenerating(false); return; }
    await supabase.from("telegram_bindings").insert({ user_id: user.id, binding_code: code });
    setBindingCode(code);
    setGenerating(false);
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl p-4 space-y-2"
        style={{ background: "rgba(8,8,16,0.5)", border: "1px solid rgba(201,169,110,0.07)" }}>
        <div className="h-4 w-32 rounded-full shimmer" />
        <div className="h-3 w-48 rounded-full shimmer" />
      </div>
    );
  }

  if (isBound) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)" }}
      >
        <CheckCircle2 className="h-5 w-5 text-green-400/70 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-green-400/90">Telegram connected</p>
          <p className="text-xs text-white/30 mt-0.5">
            You&apos;ll receive high-priority email notifications via Telegram.
          </p>
        </div>
      </motion.div>
    );
  }

  if (bindingCode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 space-y-3"
        style={{ background: "rgba(8,8,16,0.5)", border: "1px solid rgba(201,169,110,0.12)" }}
      >
        <p className="text-sm text-white/60">
          Open Telegram and send this command to <span className="text-[#c9a96e]/80">@sekpriAI_bot</span>:
        </p>
        <div className="rounded-lg px-4 py-3 font-mono text-sm text-[#c9a96e] tracking-wider select-all"
          style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.15)" }}>
          /start {bindingCode}
        </div>
        <a
          href={`https://t.me/sekpriai_bot?start=${bindingCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[#c9a96e]/60 hover:text-[#c9a96e] transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open directly in Telegram
        </a>
      </motion.div>
    );
  }

  return (
    <button
      onClick={generateCode}
      disabled={generating}
      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)" }}
    >
      {generating && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
      {generating ? "Generating..." : "Connect Telegram"}
    </button>
  );
}

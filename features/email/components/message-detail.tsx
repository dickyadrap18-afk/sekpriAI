"use client";

import { useState } from "react";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Archive, Trash2, Reply, Forward, ChevronDown,
  Send, X, Cpu, ShieldAlert, PenLine, Tag, Plus, Loader2, RefreshCw, FileText,
} from "lucide-react";
import { PriorityBadge } from "./priority-badge";
import type { Message, ComposeFormData } from "../types";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/toast";

type InlineMode = "reply" | "forward" | null;

interface MessageDetailProps {
  message: Message | null;
  loading: boolean;
  error: string | null;
  accounts: { id: string; display_name: string | null; email_address: string }[];
  onBack: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onSend: (data: ComposeFormData) => void;
  onMessageUpdate?: (updated: Partial<Message>) => void;
}

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString([], {
    weekday: "short", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// Label color palette — each label gets a consistent color
const LABEL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  INBOX:       { bg: "bg-blue-500/10",    border: "border-blue-500/25",   text: "text-blue-400" },
  IMPORTANT:   { bg: "bg-red-500/10",     border: "border-red-500/25",    text: "text-red-400" },
  STARRED:     { bg: "bg-amber-500/10",   border: "border-amber-500/25",  text: "text-amber-400" },
  NEWSLETTER:  { bg: "bg-purple-500/10",  border: "border-purple-500/25", text: "text-purple-400" },
  SENT:        { bg: "bg-green-500/10",   border: "border-green-500/25",  text: "text-green-400" },
  WORK:        { bg: "bg-cyan-500/10",    border: "border-cyan-500/25",   text: "text-cyan-400" },
  PERSONAL:    { bg: "bg-pink-500/10",    border: "border-pink-500/25",   text: "text-pink-400" },
  FINANCE:     { bg: "bg-emerald-500/10", border: "border-emerald-500/25","text": "text-emerald-400" },
  TRAVEL:      { bg: "bg-sky-500/10",     border: "border-sky-500/25",    text: "text-sky-400" },
};

const DEFAULT_LABEL_COLOR = { bg: "bg-white/[0.06]", border: "border-white/[0.1]", text: "text-muted-foreground" };

function getLabelColor(label: string) {
  return LABEL_COLORS[label.toUpperCase()] ?? DEFAULT_LABEL_COLOR;
}

const PRESET_LABELS = Object.keys(LABEL_COLORS);

export function MessageDetail({
  message, loading, error, accounts,
  onBack, onArchive, onDelete, onReply, onForward, onSend, onMessageUpdate,
}: MessageDetailProps) {
  const [inlineMode, setInlineMode] = useState<InlineMode>(null);
  const [inlineBody, setInlineBody] = useState("");
  const [inlineTo, setInlineTo] = useState("");
  const [inlineFromId, setInlineFromId] = useState(accounts[0]?.id || "");
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [customLabelInput, setCustomLabelInput] = useState("");
  const [localMessage, setLocalMessage] = useState<Message | null>(null);

  const msg = localMessage?.id === message?.id ? localMessage : message;

  function openInline(mode: InlineMode) {
    if (inlineMode === mode) { setInlineMode(null); return; }
    setInlineMode(mode);
    setInlineBody("");
    setInlineTo(mode === "reply" && msg ? msg.from_email : "");
    setInlineFromId(accounts[0]?.id || "");
  }

  function handleInlineSend() {
    if (!msg) return;
    onSend({
      from_account_id: inlineFromId,
      to: inlineTo,
      subject: inlineMode === "reply" ? `Re: ${msg.subject || ""}` : `Fwd: ${msg.subject || ""}`,
      body: inlineMode === "reply"
        ? `${inlineBody}\n\n---\nOn ${formatFullDate(msg.received_at)}, ${msg.from_name || msg.from_email} wrote:\n> ${msg.body_text?.split("\n").join("\n> ") || ""}`
        : `${inlineBody}\n\n---\nForwarded message:\nFrom: ${msg.from_name || msg.from_email} <${msg.from_email}>\nSubject: ${msg.subject || ""}\n\n${msg.body_text || ""}`,
      in_reply_to_message_id: inlineMode === "reply" ? msg.id : undefined,
    });
    setInlineMode(null);
    setInlineBody("");
  }

  async function handleAiDraft() {
    if (!msg) return;
    setAiDraftLoading(true);
    try {
      const res = await fetch("/api/messages/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: msg.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft failed");
      setInlineMode("reply");
      setInlineTo(msg.from_email);
      setInlineFromId(accounts[0]?.id || "");
      setInlineBody(data.draft_body || data.body || data.subject || "");
      showToast("AI draft ready — review before sending", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to generate draft", "error");
    } finally {
      setAiDraftLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!msg) return;
    setAnalyzeLoading(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: msg.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setLocalMessage({ ...msg, ...data });
      onMessageUpdate?.(data);
      showToast("AI analysis complete", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Analysis failed", "error");
    } finally {
      setAnalyzeLoading(false);
    }
  }

  async function applyLabelChange(newLabels: string[]) {
    if (!msg) return;
    const prev = { ...msg };
    setLocalMessage({ ...msg, labels: newLabels });
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error: err } = await supabase.from("messages").update({ labels: newLabels }).eq("id", msg.id);
    if (err) { setLocalMessage(prev); showToast("Failed to update label", "error"); }
  }

  function handleToggleLabel(label: string) {
    if (!msg) return;
    const current: string[] = msg.labels ?? [];
    const has = current.includes(label);
    applyLabelChange(has ? current.filter((l) => l !== label) : [...current, label]);
  }

  function handleAddCustomLabel() {
    const label = customLabelInput.trim().toUpperCase();
    if (!label || !msg) return;
    const current: string[] = msg.labels ?? [];
    if (!current.includes(label)) applyLabelChange([...current, label]);
    setCustomLabelInput("");
    setShowLabelMenu(false);
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        {[0.66, 0.33, 1].map((w, i) => (
          <div key={i} className="animate-pulse h-4 rounded-lg bg-white/[0.05]" style={{ width: `${w * 100}%` }} />
        ))}
        <div className="animate-pulse h-32 rounded-xl bg-white/[0.04] mt-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!msg) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl border border-[#c9a96e]/15 bg-[#c9a96e]/[0.04] flex items-center justify-center">
            <FileText className="h-7 w-7 text-[#c9a96e]/25" />
          </div>
          <div className="absolute -inset-4 rounded-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(201,169,110,0.05) 0%, transparent 70%)" }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white/40">Your secretary is ready</p>
          <p className="text-xs text-white/20 mt-1">Select a message to read</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col overflow-hidden"
    >
      {/* Header toolbar */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.05] px-3 py-2 flex-wrap flex-shrink-0"
        style={{ background: "linear-gradient(180deg, rgba(201,169,110,0.03) 0%, transparent 100%)" }}>
        <button onClick={onBack}
          className="rounded-lg p-1.5 hover:bg-white/[0.06] text-white/30 hover:text-white transition-colors lg:hidden"
          aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1" />

        {/* AI Draft */}
        <button onClick={handleAiDraft} disabled={aiDraftLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a96e]/25 bg-[#c9a96e]/[0.06] px-2.5 py-1.5 text-xs font-medium text-[#c9a96e]/80 hover:bg-[#c9a96e]/[0.12] hover:text-[#c9a96e] disabled:opacity-40 transition-all"
          title="Generate AI reply draft">
          {aiDraftLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenLine className="h-3.5 w-3.5" />}
          AI Draft
        </button>

        {/* Analyze */}
        {!msg.ai_processed_at && (
          <button onClick={handleAnalyze} disabled={analyzeLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/40 hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-40 transition-all"
            title="Run AI analysis">
            {analyzeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Analyze
          </button>
        )}

        <div className="w-px h-4 bg-white/[0.06] mx-0.5" />

        <button onClick={() => openInline("reply")}
          className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
            inlineMode === "reply"
              ? "bg-white text-black"
              : "border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.05]")}>
          <Reply className="h-3.5 w-3.5" /> Reply
        </button>
        <button onClick={() => openInline("forward")}
          className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
            inlineMode === "forward"
              ? "bg-white text-black"
              : "border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.05]")}>
          <Forward className="h-3.5 w-3.5" /> Forward
        </button>

        <div className="w-px h-4 bg-white/[0.06] mx-0.5" />

        <button onClick={() => onArchive(msg.id)}
          className="rounded-lg p-1.5 text-white/25 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
          aria-label="Archive">
          <Archive className="h-4 w-4" />
        </button>
        <button onClick={() => onDelete(msg.id)}
          className="rounded-lg p-1.5 text-white/25 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-5">

          {/* Subject + meta */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 flex-wrap">
              <h2 className="text-base font-semibold leading-snug text-foreground">{msg.subject || "(no subject)"}</h2>
              <PriorityBadge priority={msg.ai_priority} size="md" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm">
                <span className="font-medium text-foreground/80">{msg.from_name || msg.from_email}</span>
                {msg.from_name && <span className="text-muted-foreground/60"> &lt;{msg.from_email}&gt;</span>}
              </p>
              <p className="text-xs text-muted-foreground/60">To: {msg.to_emails?.join(", ")}</p>
              <p className="text-xs text-muted-foreground/50">{formatFullDate(msg.received_at)}</p>
            </div>
          </div>

          {/* AI Summary */}
          {msg.ai_summary && (
            <div className="relative rounded-xl overflow-hidden border border-[#c9a96e]/15"
              style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.06) 0%, rgba(201,169,110,0.02) 100%)" }}>
              <div className="p-4 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-[#c9a96e]/60" />
                  <p className="text-[10px] font-semibold text-[#c9a96e]/60 uppercase tracking-[0.2em]">Secretary Summary</p>
                </div>
                <p className="text-sm text-white/75 leading-relaxed">{msg.ai_summary}</p>
                {msg.ai_priority_reason && (
                  <p className="text-xs text-white/30 border-t border-white/[0.06] pt-1.5">
                    {msg.ai_priority_reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Not yet analyzed */}
          {!msg.ai_processed_at && !analyzeLoading && (
            <button onClick={handleAnalyze}
              className="w-full rounded-xl border border-dashed border-[#c9a96e]/15 p-3 text-xs text-white/25 hover:border-[#c9a96e]/30 hover:text-[#c9a96e]/50 hover:bg-[#c9a96e]/[0.03] transition-all text-center">
              <FileText className="h-3.5 w-3.5 inline mr-1.5" />
              Run AI analysis on this email
            </button>
          )}

          {/* Risk */}
          {msg.ai_risk_level && msg.ai_risk_level !== "low" && (
            <div className={cn("rounded-xl border p-3.5 flex items-start gap-3",
              msg.ai_risk_level === "high" ? "border-red-500/20 bg-red-500/[0.07]" : "border-amber-500/20 bg-amber-500/[0.07]")}>
              <ShieldAlert className={cn("h-4 w-4 mt-0.5 flex-shrink-0", msg.ai_risk_level === "high" ? "text-red-400" : "text-amber-400")} />
              <div>
                <p className={cn("text-xs font-semibold uppercase tracking-wide", msg.ai_risk_level === "high" ? "text-red-400" : "text-amber-400")}>
                  Risk: {msg.ai_risk_level}
                </p>
                <p className="text-sm text-foreground/70 mt-0.5">{msg.ai_risk_reason}</p>
              </div>
            </div>
          )}

          {/* Body — isolated dari dark theme agar HTML email tidak nabrak */}
          <div className="rounded-xl overflow-hidden border border-white/[0.06]">
            {msg.body_html ? (
              <iframe
                srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;background:#ffffff;word-break:break-word}a{color:#6366f1}img{max-width:100%;height:auto}table{max-width:100%;border-collapse:collapse}td,th{padding:4px 8px}pre,code{white-space:pre-wrap;word-break:break-all;font-size:13px}</style></head><body>${DOMPurify.sanitize(msg.body_html, {
                  FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
                  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
                  ALLOW_DATA_ATTR: false,
                })}</body></html>`}
                className="w-full min-h-[200px] border-0 bg-white"
                sandbox="allow-same-origin"
                title="Email content"
                onLoad={(e) => {
                  const iframe = e.currentTarget;
                  const doc = iframe.contentDocument;
                  if (doc) {
                    iframe.style.height = doc.documentElement.scrollHeight + "px";
                  }
                }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/80 leading-relaxed p-4 bg-white/[0.02]">
                {msg.body_text}
              </pre>
            )}
          </div>

          {/* Labels — colored + custom input */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(msg.labels ?? []).map((label) => {
                const c = getLabelColor(label);
                return (
                  <button key={label} onClick={() => handleToggleLabel(label)}
                    className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all group", c.bg, c.border, c.text, "hover:opacity-70")}
                    title={`Remove ${label}`}>
                    {label}
                    <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}

              {/* Add label button */}
              <div className="relative">
                <button onClick={() => setShowLabelMenu(!showLabelMenu)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-white/[0.15] px-2 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary/70 transition-colors">
                  <Plus className="h-3 w-3" /><Tag className="h-3 w-3" />
                </button>
                <AnimatePresence>
                  {showLabelMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-1.5 z-30 w-52 rounded-xl border border-white/[0.1] bg-[#0a0a0a] shadow-2xl overflow-hidden"
                    >
                      {/* Custom label input */}
                      <div className="p-2 border-b border-white/[0.06]">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={customLabelInput}
                            onChange={(e) => setCustomLabelInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddCustomLabel()}
                            placeholder="Custom label..."
                            className="flex-1 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                          <button onClick={handleAddCustomLabel}
                            className="h-7 w-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center hover:bg-primary/30 transition-colors">
                            <Plus className="h-3 w-3 text-primary" />
                          </button>
                        </div>
                      </div>
                      {/* Preset labels */}
                      <div className="p-1 max-h-48 overflow-y-auto">
                        {PRESET_LABELS.map((label) => {
                          const has = (msg.labels ?? []).includes(label);
                          const c = getLabelColor(label);
                          return (
                            <button key={label}
                              onClick={() => { handleToggleLabel(label); setShowLabelMenu(false); }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs hover:bg-white/[0.05] transition-colors">
                              <span className={cn("h-2 w-2 rounded-full flex-shrink-0", c.bg.replace("/10", "/60").replace("bg-", "bg-"))} />
                              <span className={has ? c.text + " font-medium" : "text-muted-foreground"}>{label}</span>
                              {has && <span className="ml-auto text-[10px] text-primary/60">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Reply / Forward Box */}
        <AnimatePresence>
          {inlineMode && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="mx-4 md:mx-6 mb-6 rounded-xl border border-white/[0.1] bg-[#0a0a0a] overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">
                  {inlineMode === "reply" ? "↩ Reply" : "↪ Forward"}
                </span>
                <button onClick={() => setInlineMode(null)} className="rounded-md p-1 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {accounts.length > 1 && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-10 flex-shrink-0">From</span>
                    <select value={inlineFromId} onChange={(e) => setInlineFromId(e.target.value)}
                      className="flex-1 h-8 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 text-xs text-foreground">
                      {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.display_name || acc.email_address}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-10 flex-shrink-0">To</span>
                  <input type="text" value={inlineTo} onChange={(e) => setInlineTo(e.target.value)}
                    className="flex-1 h-8 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="recipient@example.com" />
                </div>
                <textarea value={inlineBody} onChange={(e) => setInlineBody(e.target.value)} rows={5} autoFocus
                  placeholder={inlineMode === "reply" ? "Write your reply..." : "Add a note before forwarding..."}
                  className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors" />
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground select-none flex items-center gap-1.5">
                    <ChevronDown className="h-3 w-3" /> Show original message
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-xs border-l-2 border-white/[0.08] pl-3 text-muted-foreground/60">{msg.body_text}</pre>
                </details>
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={handleInlineSend} disabled={!inlineBody.trim() || !inlineTo.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_16px_rgba(99,102,241,0.4)]">
                    <Send className="h-3 w-3" /> Send
                  </button>
                  <button onClick={() => setInlineMode(null)}
                    className="inline-flex items-center rounded-lg border border-white/[0.1] px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors">
                    Discard
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom action bar */}
        {!inlineMode && (
          <div className="flex items-center gap-2 px-4 md:px-6 pb-6 flex-wrap">
            <button onClick={() => openInline("reply")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
              <Reply className="h-4 w-4" /> Reply
            </button>
            <button onClick={() => openInline("forward")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
              <Forward className="h-4 w-4" /> Forward
            </button>
            <button onClick={handleAiDraft} disabled={aiDraftLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a96e]/25 bg-[#c9a96e]/[0.06] px-4 py-2 text-sm font-medium text-[#c9a96e]/70 hover:bg-[#c9a96e]/[0.12] hover:text-[#c9a96e] disabled:opacity-40 transition-all">
              {aiDraftLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
              AI Draft
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, PenLine, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ComposeFormData, ComposeMode } from "../types";
import type { EmailAccount } from "../types";
import { showToast } from "@/components/toast";
import { cn } from "@/lib/utils";

interface ComposeSheetProps {
  open: boolean;
  mode: ComposeMode;
  accounts: EmailAccount[];
  prefill?: Partial<ComposeFormData>;
  onClose: () => void;
  onSend: (data: ComposeFormData) => void;
}

export function ComposeSheet({ open, mode, accounts, prefill, onClose, onSend }: ComposeSheetProps) {
  const [form, setForm] = useState<ComposeFormData>({
    from_account_id: prefill?.from_account_id || accounts[0]?.id || "",
    to: prefill?.to || "",
    cc: prefill?.cc || "",
    subject: prefill?.subject || "",
    body: prefill?.body || "",
    in_reply_to_message_id: prefill?.in_reply_to_message_id,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCc, setShowCc] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(prefill?.draft_id ?? null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open && prefill) {
      setForm({
        from_account_id: prefill.from_account_id || accounts[0]?.id || "",
        to: prefill.to || "",
        cc: prefill.cc || "",
        subject: prefill.subject || "",
        body: prefill.body || "",
        in_reply_to_message_id: prefill.in_reply_to_message_id,
      });
      setDraftId(prefill.draft_id ?? null);
      setDraftSavedAt(null);
    }
  }, [open, prefill, mode, accounts]);

  // Auto-save draft after 2s of inactivity (only for new messages)
  function scheduleDraftSave(updatedForm: ComposeFormData) {
    if (mode !== "new") return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => saveDraft(updatedForm), 2000);
  }

  async function saveDraft(currentForm: ComposeFormData) {
    // Only save if there's something to save
    if (!currentForm.body.trim() && !currentForm.subject.trim() && !currentForm.to.trim()) return;
    setDraftSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const account = accounts.find((a) => a.id === currentForm.from_account_id);
      if (!account) return;

      const draftPayload = {
        provider: account.provider || "imap",
        provider_message_id: draftId ?? `draft-${Date.now()}`,
        account_id: currentForm.from_account_id,
        from_email: account.email_address,
        from_name: account.display_name || account.email_address,
        to_emails: currentForm.to ? [currentForm.to] : [],
        subject: currentForm.subject || "(no subject)",
        body_text: currentForm.body,
        snippet: currentForm.body.slice(0, 200),
        labels: ["DRAFT"],
        is_read: true,
        is_archived: false,
        is_deleted: false,
        received_at: new Date().toISOString(),
      };

      if (draftId) {
        // Update existing draft
        await supabase.from("messages").update(draftPayload).eq("id", draftId);
      } else {
        // Create new draft
        const { data } = await supabase.from("messages").insert(draftPayload).select("id").single();
        if (data?.id) setDraftId(data.id);
      }
      setDraftSavedAt(new Date());
    } catch {
      // Draft save failure is silent
    } finally {
      setDraftSaving(false);
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.from_account_id) e.from_account_id = "Select an account";
    if (!form.to.trim()) e.to = "Recipient is required";
    if (!form.subject.trim() && mode === "new") e.subject = "Subject is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (sending) return;
    if (validate()) {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      setSending(true);
      onSend({ ...form, draft_id: draftId ?? undefined });
    }
  }

  function updateForm(updates: Partial<ComposeFormData>) {
    const updated = { ...form, ...updates };
    setForm(updated);
    scheduleDraftSave(updated);
  }

  async function handleAiCompose() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          to: form.to,
          subject: form.subject,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI compose failed");
      setForm((prev) => ({
        ...prev,
        subject: data.subject || prev.subject,
        body: data.body || prev.body,
      }));
      setShowAiPrompt(false);
      setAiPrompt("");
      showToast("AI draft ready — review before sending", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "AI compose failed", "error");
    } finally {
      setAiLoading(false);
    }
  }

  const title = mode === "reply" ? "Reply" : mode === "forward" ? "Forward" : "New Message";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="compose-title">
          {/* Overlay */}
          <motion.div
            key="compose-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="compose-sheet"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-50 w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/[0.1] bg-[#0a0a0a] shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sticky top-0 bg-[#0a0a0a] z-10">
              <div className="flex items-center gap-2">
                <h3 id="compose-title" className="text-sm font-semibold text-foreground">{title}</h3>
                {/* Draft status */}
                {mode === "new" && (
                  <span className="text-[11px] text-muted-foreground/60">
                    {draftSaving ? "Saving..." : draftSavedAt ? `Draft saved ${draftSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* AI Compose toggle */}
                {mode === "new" && (
                  <button
                    type="button"
                    onClick={() => setShowAiPrompt(!showAiPrompt)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                      showAiPrompt
                        ? "bg-violet-500/20 border border-violet-500/30 text-violet-300"
                        : "border border-white/[0.1] text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
                    )}
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    AI Write
                  </button>
                )}
                <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* AI Compose prompt */}
              <AnimatePresence>
                {showAiPrompt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.07] p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <PenLine className="h-3.5 w-3.5 text-violet-400" />
                        <p className="text-xs font-semibold text-violet-300">AI Write</p>
                      </div>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={3}
                        placeholder="Describe what you want to write... e.g. 'Write a professional follow-up email about the Q3 budget meeting'"
                        className="w-full rounded-lg border border-violet-500/20 bg-black/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleAiCompose}
                        disabled={aiLoading || !aiPrompt.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenLine className="h-3.5 w-3.5" />}
                        {aiLoading ? "Writing..." : "Generate Draft"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* From */}
              <div className="space-y-1">
                <label htmlFor="from" className="text-xs font-medium text-muted-foreground">From</label>
                <select id="from" value={form.from_account_id}
                  onChange={(e) => updateForm({ from_account_id: e.target.value })}
                  className="input-base bg-white/[0.04] border-white/[0.1] text-foreground">
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.display_name || acc.email_address}</option>
                  ))}
                </select>
                {errors.from_account_id && <p className="text-xs text-red-400">{errors.from_account_id}</p>}
              </div>

              {/* To */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="to" className="text-xs font-medium text-muted-foreground">To</label>
                  <button type="button" onClick={() => setShowCc(!showCc)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                    CC <ChevronDown className={cn("h-3 w-3 transition-transform", showCc && "rotate-180")} />
                  </button>
                </div>
                <input id="to" type="text" value={form.to}
                  onChange={(e) => updateForm({ to: e.target.value })}
                  className="input-base bg-white/[0.04] border-white/[0.1] text-foreground"
                  placeholder="recipient@example.com" />
                {errors.to && <p className="text-xs text-red-400">{errors.to}</p>}
              </div>

              {/* CC — collapsible */}
              <AnimatePresence>
                {showCc && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-1">
                    <label htmlFor="cc" className="text-xs font-medium text-muted-foreground">CC</label>
                    <input id="cc" type="text" value={form.cc || ""}
                      onChange={(e) => updateForm({ cc: e.target.value })}
                      className="input-base bg-white/[0.04] border-white/[0.1] text-foreground"
                      placeholder="cc@example.com" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Subject */}
              <div className="space-y-1">
                <label htmlFor="subject" className="text-xs font-medium text-muted-foreground">Subject</label>
                <input id="subject" type="text" value={form.subject}
                  onChange={(e) => updateForm({ subject: e.target.value })}
                  className="input-base bg-white/[0.04] border-white/[0.1] text-foreground"
                  placeholder="Subject" />
                {errors.subject && <p className="text-xs text-red-400">{errors.subject}</p>}
              </div>

              {/* Body */}
              <div className="space-y-1">
                <label htmlFor="body" className="text-xs font-medium text-muted-foreground">Message</label>
                <textarea id="body" value={form.body}
                  onChange={(e) => updateForm({ body: e.target.value })}
                  rows={9}
                  className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                  placeholder="Write your message..." />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.05]">
                <button type="submit" disabled={sending}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  style={{ background: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)" }}>
                  {sending
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</>
                    : <><Send className="h-3.5 w-3.5" /> Send</>
                  }
                </button>
                <button type="button" onClick={onClose} disabled={sending}
                  className="inline-flex items-center rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors disabled:opacity-40">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

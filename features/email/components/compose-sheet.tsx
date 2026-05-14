"use client";

import { useState } from "react";
import { X, Send, Clock } from "lucide-react";
import type { ComposeFormData, ComposeMode } from "../types";
import type { EmailAccount } from "@/lib/supabase/types";

interface ComposeSheetProps {
  open: boolean;
  mode: ComposeMode;
  accounts: EmailAccount[];
  prefill?: Partial<ComposeFormData>;
  onClose: () => void;
  onSend: (data: ComposeFormData) => void;
}

export function ComposeSheet({
  open,
  mode,
  accounts,
  prefill,
  onClose,
  onSend,
}: ComposeSheetProps) {
  const [form, setForm] = useState<ComposeFormData>({
    from_account_id: prefill?.from_account_id || accounts[0]?.id || "",
    to: prefill?.to || "",
    cc: prefill?.cc || "",
    subject: prefill?.subject || "",
    body: prefill?.body || "",
    in_reply_to_message_id: prefill?.in_reply_to_message_id,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.from_account_id) newErrors.from_account_id = "Select an account";
    if (!form.to.trim()) newErrors.to = "Recipient is required";
    if (!form.subject.trim() && mode === "new")
      newErrors.subject = "Subject is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onSend(form);
    }
  }

  const title =
    mode === "reply" ? "Reply" : mode === "forward" ? "Forward" : "New Message";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-50 w-full max-w-lg rounded-t-lg sm:rounded-lg border bg-background shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Close compose"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* From */}
          <div className="space-y-1">
            <label htmlFor="from" className="text-xs font-medium text-muted-foreground">
              From
            </label>
            <select
              id="from"
              value={form.from_account_id}
              onChange={(e) =>
                setForm({ ...form, from_account_id: e.target.value })
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.display_name || acc.email_address}
                </option>
              ))}
            </select>
            {errors.from_account_id && (
              <p className="text-xs text-red-600">{errors.from_account_id}</p>
            )}
          </div>

          {/* To */}
          <div className="space-y-1">
            <label htmlFor="to" className="text-xs font-medium text-muted-foreground">
              To
            </label>
            <input
              id="to"
              type="text"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              placeholder="recipient@example.com"
            />
            {errors.to && <p className="text-xs text-red-600">{errors.to}</p>}
          </div>

          {/* CC */}
          <div className="space-y-1">
            <label htmlFor="cc" className="text-xs font-medium text-muted-foreground">
              CC
            </label>
            <input
              id="cc"
              type="text"
              value={form.cc}
              onChange={(e) => setForm({ ...form, cc: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              placeholder="cc@example.com"
            />
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label htmlFor="subject" className="text-xs font-medium text-muted-foreground">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              placeholder="Subject"
            />
            {errors.subject && (
              <p className="text-xs text-red-600">{errors.subject}</p>
            )}
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label htmlFor="body" className="text-xs font-medium text-muted-foreground">
              Message
            </label>
            <textarea
              id="body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={8}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Write your message..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => {
                // Schedule functionality - Phase 8
                alert("Schedule feature coming in Phase 8");
              }}
            >
              <Clock className="h-3.5 w-3.5" />
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

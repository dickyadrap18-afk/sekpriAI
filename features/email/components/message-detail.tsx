"use client";

import { useState } from "react";
import DOMPurify from "dompurify";
import { ArrowLeft, Archive, Trash2, Reply, Forward, ChevronDown, ChevronUp, Send, X } from "lucide-react";
import { PriorityBadge } from "./priority-badge";
import type { Message } from "../types";
import type { ComposeFormData } from "../types";
import { cn } from "@/lib/utils";

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
}

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageDetail({
  message,
  loading,
  error,
  accounts,
  onBack,
  onArchive,
  onDelete,
  onReply,
  onForward,
  onSend,
}: MessageDetailProps) {
  const [inlineMode, setInlineMode] = useState<InlineMode>(null);
  const [inlineBody, setInlineBody] = useState("");
  const [inlineTo, setInlineTo] = useState("");
  const [inlineFromId, setInlineFromId] = useState(accounts[0]?.id || "");

  function openInline(mode: InlineMode) {
    if (inlineMode === mode) {
      setInlineMode(null);
      return;
    }
    setInlineMode(mode);
    setInlineBody("");
    if (mode === "reply" && message) {
      setInlineTo(message.from_email);
    } else {
      setInlineTo("");
    }
    setInlineFromId(accounts[0]?.id || "");
  }

  function handleInlineSend() {
    if (!message) return;
    const data: ComposeFormData = {
      from_account_id: inlineFromId,
      to: inlineTo,
      subject:
        inlineMode === "reply"
          ? `Re: ${message.subject || ""}`
          : `Fwd: ${message.subject || ""}`,
      body:
        inlineMode === "reply"
          ? `${inlineBody}\n\n---\nOn ${formatFullDate(message.received_at)}, ${message.from_name || message.from_email} wrote:\n> ${message.body_text?.split("\n").join("\n> ") || ""}`
          : `${inlineBody}\n\n---\nForwarded message:\nFrom: ${message.from_name || message.from_email} <${message.from_email}>\nSubject: ${message.subject || ""}\n\n${message.body_text || ""}`,
      in_reply_to_message_id: inlineMode === "reply" ? message.id : undefined,
    };
    onSend(data);
    setInlineMode(null);
    setInlineBody("");
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <div className="animate-pulse h-6 w-2/3 bg-muted rounded" />
        <div className="animate-pulse h-4 w-1/3 bg-muted rounded" />
        <div className="animate-pulse h-32 bg-muted rounded mt-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground gap-2">
        <Reply className="h-10 w-10 opacity-20" />
        <p className="text-sm font-medium">No message selected</p>
        <p className="text-xs">Pick an email from the list to read it here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header toolbar */}
      <div className="flex items-center gap-1 border-b px-3 py-2 bg-background">
        <button
          onClick={onBack}
          className="rounded-md p-1.5 hover:bg-accent lg:hidden"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex-1" />

        {/* Reply / Forward — prominent buttons */}
        <button
          onClick={() => openInline("reply")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            inlineMode === "reply"
              ? "bg-primary text-primary-foreground"
              : "border hover:bg-accent"
          )}
          aria-label="Reply"
        >
          <Reply className="h-3.5 w-3.5" />
          Reply
        </button>
        <button
          onClick={() => openInline("forward")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            inlineMode === "forward"
              ? "bg-primary text-primary-foreground"
              : "border hover:bg-accent"
          )}
          aria-label="Forward"
        >
          <Forward className="h-3.5 w-3.5" />
          Forward
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          onClick={() => onArchive(message.id)}
          className="rounded-md p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground"
          aria-label="Archive"
          title="Archive"
        >
          <Archive className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(message.id)}
          className="rounded-md p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-600"
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-4">
          {/* Subject + priority */}
          <div className="space-y-1">
            <div className="flex items-start gap-2 flex-wrap">
              <h2 className="text-lg font-semibold leading-tight">
                {message.subject || "(no subject)"}
              </h2>
              <PriorityBadge priority={message.ai_priority} />
            </div>
            <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">
                  {message.from_name || message.from_email}
                </span>{" "}
                &lt;{message.from_email}&gt;
              </span>
              <span className="text-xs">To: {message.to_emails?.join(", ")}</span>
              <span className="text-xs">{formatFullDate(message.received_at)}</span>
            </div>
          </div>

          {/* AI Summary card */}
          {message.ai_summary && (
            <div className="rounded-lg border bg-accent/30 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                AI Summary
              </p>
              <p className="text-sm">{message.ai_summary}</p>
            </div>
          )}

          {/* Risk badge */}
          {message.ai_risk_level && message.ai_risk_level !== "low" && (
            <div
              className={cn(
                "rounded-lg border p-3 space-y-1",
                message.ai_risk_level === "high"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
              )}
            >
              <p className="text-xs font-medium uppercase tracking-wide">
                Risk: {message.ai_risk_level}
              </p>
              <p className="text-sm">{message.ai_risk_reason}</p>
            </div>
          )}

          {/* Body */}
          <div className="prose prose-sm max-w-none">
            {message.body_html ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(message.body_html, {
                    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
                    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
                    ALLOW_DATA_ATTR: false,
                  }),
                }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {message.body_text}
              </pre>
            )}
          </div>

          {/* Labels */}
          {message.labels && message.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {message.labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Inline Reply / Forward Box ── */}
        {inlineMode && (
          <div className="border-t mx-4 md:mx-6 mb-6 rounded-lg border shadow-sm bg-background overflow-hidden">
            {/* Box header */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {inlineMode === "reply" ? "Reply" : "Forward"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setInlineMode(null)}
                  className="rounded p-1 hover:bg-accent"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-2">
              {/* From */}
              {accounts.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12 flex-shrink-0">From</span>
                  <select
                    value={inlineFromId}
                    onChange={(e) => setInlineFromId(e.target.value)}
                    className="flex-1 h-8 rounded border border-input bg-background px-2 text-xs"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.display_name || acc.email_address}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* To */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12 flex-shrink-0">To</span>
                <input
                  type="text"
                  value={inlineTo}
                  onChange={(e) => setInlineTo(e.target.value)}
                  className="flex-1 h-8 rounded border border-input bg-background px-2 text-xs"
                  placeholder="recipient@example.com"
                />
              </div>

              {/* Textarea */}
              <textarea
                value={inlineBody}
                onChange={(e) => setInlineBody(e.target.value)}
                rows={5}
                autoFocus
                placeholder={
                  inlineMode === "reply"
                    ? "Write your reply..."
                    : "Add a note before forwarding..."
                }
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {/* Quoted original (collapsed hint) */}
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground select-none flex items-center gap-1">
                  <ChevronDown className="h-3 w-3" />
                  Show original message
                </summary>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-xs border-l-2 border-muted pl-3 text-muted-foreground">
                  {message.body_text}
                </pre>
              </details>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleInlineSend}
                  disabled={!inlineBody.trim() || !inlineTo.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-3 w-3" />
                  Send
                </button>
                <button
                  onClick={() => setInlineMode(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick action bar at bottom when no inline box */}
        {!inlineMode && (
          <div className="flex items-center gap-2 px-4 md:px-6 pb-6">
            <button
              onClick={() => openInline("reply")}
              className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Reply className="h-4 w-4" />
              Reply
            </button>
            <button
              onClick={() => openInline("forward")}
              className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Forward className="h-4 w-4" />
              Forward
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

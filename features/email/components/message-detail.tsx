"use client";

import DOMPurify from "dompurify";
import { ArrowLeft, Archive, Trash2, Reply, Forward } from "lucide-react";
import { PriorityBadge } from "./priority-badge";
import type { Message } from "../types";
import { cn } from "@/lib/utils";

interface MessageDetailProps {
  message: Message | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
}

export function MessageDetail({
  message,
  loading,
  error,
  onBack,
  onArchive,
  onDelete,
  onReply,
  onForward,
}: MessageDetailProps) {
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
      <div className="flex-1 flex items-center justify-center p-6 text-muted-foreground">
        <p className="text-sm">Select a message to read</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-md p-1.5 hover:bg-accent lg:hidden"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => onReply(message)}
          className="rounded-md p-1.5 hover:bg-accent"
          aria-label="Reply"
        >
          <Reply className="h-4 w-4" />
        </button>
        <button
          onClick={() => onForward(message)}
          className="rounded-md p-1.5 hover:bg-accent"
          aria-label="Forward"
        >
          <Forward className="h-4 w-4" />
        </button>
        <button
          onClick={() => onArchive(message.id)}
          className="rounded-md p-1.5 hover:bg-accent"
          aria-label="Archive"
        >
          <Archive className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(message.id)}
          className="rounded-md p-1.5 hover:bg-accent text-red-600"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Subject + priority */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {message.subject || "(no subject)"}
            </h2>
            <PriorityBadge priority={message.ai_priority} />
          </div>
          <p className="text-sm text-muted-foreground">
            From: {message.from_name || message.from_email}{" "}
            &lt;{message.from_email}&gt;
          </p>
          <p className="text-xs text-muted-foreground">
            To: {message.to_emails?.join(", ")}
          </p>
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
    </div>
  );
}

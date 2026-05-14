"use client";

import { cn } from "@/lib/utils";
import { PriorityBadge } from "./priority-badge";
import type { MessageListItem } from "../types";

interface MessageListItemProps {
  message: MessageListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffHours < 168) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessageListItemComponent({
  message,
  isSelected,
  onSelect,
}: MessageListItemProps) {
  return (
    <button
      onClick={() => onSelect(message.id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors",
        isSelected
          ? "bg-accent"
          : "hover:bg-accent/50",
        !message.is_read && "font-medium"
      )}
    >
      {/* Unread indicator */}
      <div className="mt-2 flex-shrink-0">
        {!message.is_read && (
          <div className="h-2 w-2 rounded-full bg-primary" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm">
            {message.from_name || message.from_email}
          </span>
          <span className="flex-shrink-0 text-xs text-muted-foreground">
            {formatDate(message.received_at)}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="truncate text-sm text-foreground">
            {message.subject || "(no subject)"}
          </span>
          <PriorityBadge priority={message.ai_priority} />
        </div>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {message.snippet}
        </p>
      </div>
    </button>
  );
}

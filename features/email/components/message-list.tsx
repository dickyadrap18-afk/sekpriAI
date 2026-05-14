"use client";

import { MessageListItemComponent } from "./message-list-item";
import type { MessageListItem } from "../types";

interface MessageListProps {
  messages: MessageListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  error: string | null;
}

export function MessageList({
  messages,
  selectedId,
  onSelect,
  loading,
  error,
}: MessageListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-md bg-muted h-16" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-red-600">Failed to load messages</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">No messages found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Connect an email account or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y overflow-y-auto">
      {messages.map((msg) => (
        <MessageListItemComponent
          key={msg.id}
          message={msg}
          isSelected={selectedId === msg.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

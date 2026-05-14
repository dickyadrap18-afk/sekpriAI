"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { MessageListItemComponent } from "./message-list-item";
import { DragDropZones } from "./drag-drop-zones";
import type { MessageListItem } from "../types";
import { PAGE_SIZE } from "../hooks/use-inbox";

interface MessageListProps {
  messages: MessageListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onStar: (id: string) => void;
  onMarkRead: (id: string, read: boolean) => void;
  onLabelToggle: (id: string, label: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveTo: (id: string, folder: string) => void;
}

export function MessageList({
  messages, selectedId, onSelect, loading, error,
  total, page, onPageChange,
  onStar, onMarkRead, onLabelToggle, onArchive, onDelete, onMoveTo,
}: MessageListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);

  if (loading) {
    return (
      <div className="space-y-px p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg px-3 py-3 space-y-2" style={{ opacity: 1 - i * 0.12 }}>
            <div className="flex justify-between gap-4">
              <div className="h-3 w-28 rounded-full bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-10 rounded-full bg-white/[0.04] animate-pulse" />
            </div>
            <div className="h-3 w-48 rounded-full bg-white/[0.05] animate-pulse" />
            <div className="h-2.5 w-36 rounded-full bg-white/[0.03] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-2">
        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <span className="text-red-400 text-lg">!</span>
        </div>
        <p className="text-sm text-red-400">Failed to load messages</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-10 text-center gap-3"
      >
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Inbox className="h-5 w-5 text-primary/60" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/70">All clear</p>
          <p className="text-xs text-muted-foreground mt-0.5">No messages here.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.2), duration: 0.15 }}
          >
            <MessageListItemComponent
              message={msg}
              isSelected={selectedId === msg.id}
              onSelect={onSelect}
              onStar={onStar}
              onMarkRead={onMarkRead}
              onLabelToggle={onLabelToggle}
              onArchive={onArchive}
              onDelete={onDelete}
              onMoveTo={onMoveTo}
              onDragStart={(id) => setDraggingId(id)}
              onDragEnd={() => setDraggingId(null)}
            />
          </motion.div>
        ))}
      </div>

      {/* Drag-and-drop zones — appear when dragging */}
      <DragDropZones
        visible={draggingId !== null}
        onDrop={(action) => {
          if (!draggingId) return;
          if (action === "archive") onArchive(draggingId);
          else onDelete(draggingId);
          setDraggingId(null);
        }}
      />

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.06] flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {start}–{end} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground px-1">
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

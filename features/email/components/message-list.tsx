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

// Fixed widths per row index — no Math.random() to avoid SSR/client hydration mismatch
const SKELETON_WIDTHS = [
  { w1: "62%", w2: "72%", w3: "45%" },
  { w1: "48%", w2: "65%", w3: "38%" },
  { w1: "70%", w2: "58%", w3: "52%" },
  { w1: "55%", w2: "78%", w3: "40%" },
  { w1: "42%", w2: "68%", w3: "55%" },
  { w1: "66%", w2: "60%", w3: "35%" },
  { w1: "50%", w2: "74%", w3: "48%" },
];

function SkeletonRow({ opacity, index }: { opacity: number; index: number }) {
  const w = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length];
  return (
    <div className="flex items-start gap-2.5 px-3 py-3 border-b border-white/[0.03]" style={{ opacity }}>
      <div className="mt-1.5 w-2 flex-shrink-0">
        <div className="h-1.5 w-1.5 rounded-full bg-white/[0.06]" />
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="flex justify-between gap-4">
          <div className="h-3 rounded-md bg-white/[0.06] shimmer" style={{ width: w.w1 }} />
          <div className="h-3 w-10 rounded-md bg-white/[0.04] shimmer" />
        </div>
        <div className="h-2.5 rounded-md bg-white/[0.05] shimmer" style={{ width: w.w2 }} />
        <div className="h-2 rounded-md bg-white/[0.03] shimmer" style={{ width: w.w3 }} />
      </div>
    </div>
  );
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
      <div className="flex-1 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonRow key={i} opacity={1 - i * 0.11} index={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
        <div className="h-10 w-10 rounded-full border border-red-500/20 bg-red-500/[0.06] flex items-center justify-center">
          <span className="text-red-400 text-sm font-bold">!</span>
        </div>
        <p className="text-sm text-red-400/80">Failed to load messages</p>
        <p className="text-xs text-white/20">{error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-10 text-center gap-4"
      >
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl border border-[#c9a96e]/15 bg-[#c9a96e]/[0.04] flex items-center justify-center">
            <Inbox className="h-6 w-6 text-[#c9a96e]/30" />
          </div>
          <div className="absolute -inset-3 rounded-3xl"
            style={{ background: "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)" }} />
        </div>
        <div>
          <p className="text-sm font-medium text-white/50">All clear</p>
          <p className="text-xs text-white/20 mt-0.5">No messages in this folder</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.15), duration: 0.15 }}
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

      <DragDropZones
        visible={draggingId !== null}
        onDrop={(action) => {
          if (!draggingId) return;
          if (action === "archive") onArchive(draggingId);
          else onDelete(draggingId);
          setDraggingId(null);
        }}
      />

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.05] flex-shrink-0"
          style={{ background: "linear-gradient(0deg, rgba(201,169,110,0.02) 0%, transparent 100%)" }}>
          <span className="text-[11px] text-white/25 tabular-nums">
            {start}–{end} <span className="text-white/15">of {total}</span>
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="rounded-lg p-1.5 text-white/25 hover:bg-white/[0.05] hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] text-white/25 px-1.5 tabular-nums">{page + 1}/{totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="rounded-lg p-1.5 text-white/25 hover:bg-white/[0.05] hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

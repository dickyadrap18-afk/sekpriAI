"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "./priority-badge";
import { MessageContextMenu, type ContextMenuPosition } from "./message-context-menu";
import type { MessageListItem } from "../types";

interface MessageListItemProps {
  message: MessageListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStar: (id: string) => void;
  onMarkRead: (id: string, read: boolean) => void;
  onLabelToggle: (id: string, label: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveTo: (id: string, folder: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffHours < 168) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessageListItemComponent({
  message, isSelected, onSelect,
  onStar, onMarkRead, onLabelToggle, onArchive, onDelete, onMoveTo,
  onDragStart, onDragEnd,
}: MessageListItemProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isHigh = message.ai_priority === "high";
  const isStarred = (message.labels ?? []).includes("STARRED");
  const isUnread = !message.is_read;

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", message.id);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    onDragStart?.(message.id);
  }

  function handleDragEnd() {
    setIsDragging(false);
    onDragEnd?.();
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: isDragging ? 0.3 : 1, x: 0, scale: isDragging ? 0.98 : 1 }}
        transition={{ duration: 0.18 }}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        onClick={() => !isDragging && onSelect(message.id)}
        className={cn(
          "group relative flex w-full items-start gap-2.5 px-3 py-3 text-left cursor-pointer select-none",
          "border-b border-white/[0.04] last:border-0 transition-all duration-150",
          isSelected
            ? "bg-[#c9a96e]/[0.08]"
            : isUnread
              ? "hover:bg-white/[0.04]"
              : "hover:bg-white/[0.02]",
        )}
      >
        {/* Left accent bar */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-[2px] rounded-r transition-all duration-200",
          isSelected
            ? "bg-gradient-to-b from-[#e8d5b0] to-[#c9a96e] opacity-100"
            : isHigh
              ? "bg-red-500/60 opacity-100"
              : "opacity-0"
        )} />

        {/* Unread dot */}
        <div className="mt-[5px] flex-shrink-0 w-2 flex justify-center">
          {isUnread && !isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "h-1.5 w-1.5 rounded-full flex-shrink-0",
                isHigh ? "bg-red-400 pulse-dot" : "bg-[#c9a96e]"
              )}
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-0.5">
          {/* Row 1: sender + date */}
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "truncate text-[13px] leading-tight",
              isUnread ? "font-semibold text-white" : "font-normal text-white/60",
              isSelected && "text-white"
            )}>
              {message.from_name || message.from_email}
            </span>
            <span className={cn(
              "text-[11px] flex-shrink-0 tabular-nums",
              isUnread ? "text-white/50" : "text-white/25",
              isSelected && "text-[#c9a96e]/60"
            )}>
              {formatDate(message.received_at)}
            </span>
          </div>

          {/* Row 2: subject + badge */}
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "truncate text-xs leading-tight",
              isUnread ? "font-medium text-white/85" : "text-white/45",
              isSelected && "text-white/80"
            )}>
              {message.subject || "(no subject)"}
            </span>
            <PriorityBadge priority={message.ai_priority} />
          </div>

          {/* Row 3: snippet */}
          <p className={cn(
            "truncate text-[11px] leading-tight",
            isUnread ? "text-white/35" : "text-white/20",
            isSelected && "text-white/30"
          )}>
            {message.snippet}
          </p>
        </div>

        {/* Star */}
        <button
          onClick={(e) => { e.stopPropagation(); onStar(message.id); }}
          className={cn(
            "flex-shrink-0 mt-0.5 rounded p-0.5 transition-all",
            isStarred
              ? "text-[#c9a96e] opacity-100"
              : "text-transparent group-hover:text-white/20 hover:!text-[#c9a96e]/60"
          )}
          aria-label={isStarred ? "Remove star" : "Star"}
        >
          <Star className={cn("h-3.5 w-3.5", isStarred && "fill-[#c9a96e]")} />
        </button>
      </motion.div>

      <AnimatePresence>
        {contextMenu && (
          <MessageContextMenu
            position={contextMenu}
            messageId={message.id}
            isRead={message.is_read}
            isStarred={isStarred}
            currentLabels={message.labels ?? []}
            onClose={() => setContextMenu(null)}
            onStar={onStar}
            onMarkRead={onMarkRead}
            onLabelToggle={onLabelToggle}
            onArchive={onArchive}
            onDelete={onDelete}
            onMoveTo={onMoveTo}
          />
        )}
      </AnimatePresence>
    </>
  );
}

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
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: isDragging ? 0.4 : 1, x: 0, scale: isDragging ? 0.98 : 1 }}
        transition={{ duration: 0.2 }}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        className={cn(
          "relative flex w-full items-start gap-2 px-3 py-2.5 text-left transition-all duration-150 cursor-grab active:cursor-grabbing select-none",
          "border-b border-white/[0.04] last:border-0",
          isDragging && "opacity-40",
          isSelected
            ? "bg-white/[0.08] border-l-2 border-l-white"
            : cn(
                "border-l-2 border-l-transparent",
                isUnread
                  ? "bg-white/[0.04] hover:bg-white/[0.06]"
                  : "hover:bg-white/[0.02]"
              ),
        )}
        onClick={() => !isDragging && onSelect(message.id)}
      >
        {/* High priority left accent */}
        {isHigh && !isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500/70 rounded-r" />
        )}

        {/* Unread indicator — blue dot like Gmail */}
        <div className="mt-1.5 flex-shrink-0 w-2 flex justify-center">
          {isUnread && (
            <div className={cn(
              "h-2 w-2 rounded-full flex-shrink-0",
              isHigh ? "bg-red-400 pulse-dot" : "bg-primary"
            )} />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            {/* Sender — bold if unread */}
            <span className={cn(
              "truncate text-sm leading-tight",
              isUnread ? "font-bold text-white" : "font-normal text-white/70"
            )}>
              {message.from_name || message.from_email}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={cn(
                "text-[11px]",
                isUnread ? "text-white/60 font-medium" : "text-white/30"
              )}>
                {formatDate(message.received_at)}
              </span>
            </div>
          </div>

          {/* Subject — bold if unread */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn(
              "truncate text-xs leading-tight",
              isUnread ? "font-semibold text-white/90" : "text-white/55"
            )}>
              {message.subject || "(no subject)"}
            </span>
            <PriorityBadge priority={message.ai_priority} />
          </div>

          {/* Snippet */}
          <p className={cn(
            "mt-0.5 truncate text-xs",
            isUnread ? "text-white/50" : "text-white/30"
          )}>
            {message.snippet}
          </p>
        </div>

        {/* Star button */}
        <button
          onClick={(e) => { e.stopPropagation(); onStar(message.id); }}
          className={cn(
            "flex-shrink-0 mt-1 rounded p-0.5 transition-colors",
            isStarred
              ? "text-amber-400 hover:text-amber-300"
              : "text-transparent hover:text-muted-foreground/40 group-hover:text-muted-foreground/30"
          )}
          aria-label={isStarred ? "Remove star" : "Star"}
        >
          <Star className={cn("h-3.5 w-3.5", isStarred && "fill-amber-400")} />
        </button>
      </motion.div>

      {/* Context menu */}
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

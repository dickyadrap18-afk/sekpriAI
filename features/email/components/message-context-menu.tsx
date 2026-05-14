"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Tag, Archive, Trash2, Mail, MailOpen, FolderInput, ChevronRight, Check } from "lucide-react";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface MessageContextMenuProps {
  position: ContextMenuPosition;
  messageId: string;
  isRead: boolean;
  isStarred: boolean;
  currentLabels: string[];
  onClose: () => void;
  onStar: (id: string) => void;
  onMarkRead: (id: string, read: boolean) => void;
  onLabelToggle: (id: string, label: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveTo: (id: string, folder: string) => void;
}

const LABEL_OPTIONS = ["INBOX", "IMPORTANT", "STARRED", "NEWSLETTER", "WORK", "PERSONAL", "FINANCE", "TRAVEL"];
const FOLDER_OPTIONS = [
  { key: "inbox",     label: "Inbox" },
  { key: "archive",   label: "Archive" },
  { key: "trash",     label: "Trash" },
  { key: "important", label: "Important" },
];

export function MessageContextMenu({
  position, messageId, isRead, isStarred, currentLabels,
  onClose, onStar, onMarkRead, onLabelToggle, onArchive, onDelete, onMoveTo,
}: MessageContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<"label" | "move" | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const menuWidth = 192;
  const menuHeight = 280;
  const x = Math.min(position.x, window.innerWidth - menuWidth - 8);
  const y = Math.min(position.y, window.innerHeight - menuHeight - 8);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.12 }}
      style={{ position: "fixed", left: x, top: y, zIndex: 9999 }}
      className="w-48 rounded-xl border border-white/[0.1] bg-[#0a0a0a] shadow-2xl overflow-visible py-1"
      role="menu"
    >
      {/* Star */}
      <button onClick={() => { onStar(messageId); onClose(); }} role="menuitem"
        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors">
        <Star className={`h-3.5 w-3.5 flex-shrink-0 ${isStarred ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
        <span className="text-foreground/80">{isStarred ? "Remove star" : "Star"}</span>
      </button>

      {/* Mark read/unread */}
      <button onClick={() => { onMarkRead(messageId, !isRead); onClose(); }} role="menuitem"
        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors">
        {isRead
          ? <Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          : <MailOpen className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />}
        <span className="text-foreground/80">{isRead ? "Mark as unread" : "Mark as read"}</span>
      </button>

      <div className="my-1 border-t border-white/[0.06]" />

      {/* Label as — with submenu */}
      <div className="relative">
        <button
          onMouseEnter={() => setSubmenu("label")}
          onMouseLeave={() => setSubmenu(null)}
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors"
        >
          <Tag className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left text-foreground/80">Label as</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
        </button>

        <AnimatePresence>
          {submenu === "label" && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.1 }}
              onMouseEnter={() => setSubmenu("label")}
              onMouseLeave={() => setSubmenu(null)}
              className="absolute left-full top-0 ml-1 w-44 rounded-xl border border-white/[0.1] bg-[#0a0a0a] shadow-2xl overflow-hidden py-1 z-[10000]"
            >
              {LABEL_OPTIONS.map((label) => {
                const has = currentLabels.includes(label);
                return (
                  <button key={label}
                    onClick={() => { onLabelToggle(messageId, label); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors"
                  >
                    <Check className={`h-3 w-3 flex-shrink-0 ${has ? "text-primary" : "text-transparent"}`} />
                    <span className={has ? "text-primary font-medium" : "text-foreground/80"}>{label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Move to — with submenu */}
      <div className="relative">
        <button
          onMouseEnter={() => setSubmenu("move")}
          onMouseLeave={() => setSubmenu(null)}
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors"
        >
          <FolderInput className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left text-foreground/80">Move to</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
        </button>

        <AnimatePresence>
          {submenu === "move" && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.1 }}
              onMouseEnter={() => setSubmenu("move")}
              onMouseLeave={() => setSubmenu(null)}
              className="absolute left-full top-0 ml-1 w-36 rounded-xl border border-white/[0.1] bg-[#0a0a0a] shadow-2xl overflow-hidden py-1 z-[10000]"
            >
              {FOLDER_OPTIONS.map((f) => (
                <button key={f.key}
                  onClick={() => { onMoveTo(messageId, f.key); onClose(); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors text-foreground/80"
                >
                  {f.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="my-1 border-t border-white/[0.06]" />

      {/* Archive */}
      <button onClick={() => { onArchive(messageId); onClose(); }} role="menuitem"
        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors">
        <Archive className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        <span className="text-foreground/80">Archive</span>
      </button>

      {/* Delete */}
      <button onClick={() => { onDelete(messageId); onClose(); }} role="menuitem"
        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors">
        <Trash2 className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
        <span className="text-red-400">Delete</span>
      </button>
    </motion.div>
  );
}

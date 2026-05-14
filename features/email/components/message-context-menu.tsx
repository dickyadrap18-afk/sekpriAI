"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const MENU_BG: React.CSSProperties = {
  background: "rgba(14,12,22,0.98)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(201,169,110,0.18)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)",
  borderRadius: 12,
};

export function MessageContextMenu({
  position, messageId, isRead, isStarred, currentLabels,
  onClose, onStar, onMarkRead, onLabelToggle, onArchive, onDelete, onMoveTo,
}: MessageContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<"label" | "move" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  if (!mounted) return null;

  // Clamp menu to viewport
  const MENU_W = 200;
  const MENU_H = 310;
  const SUB_W = 180;
  const mx = Math.min(Math.max(position.x, 8), window.innerWidth - MENU_W - 8);
  const my = Math.min(Math.max(position.y, 8), window.innerHeight - MENU_H - 8);
  // Submenu direction
  const subRight = mx + MENU_W + SUB_W + 8 < window.innerWidth;

  const menu = (
    <AnimatePresence>
      <motion.div
        ref={ref}
        key="ctx-menu"
        initial={{ opacity: 0, scale: 0.95, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -6 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        style={{
          position: "fixed",
          left: mx,
          top: my,
          width: MENU_W,
          zIndex: 99999,
          ...MENU_BG,
        }}
        className="py-1 overflow-visible"
        role="menu"
      >
        {/* Star */}
        <MI
          icon={<Star className={`h-3.5 w-3.5 ${isStarred ? "fill-[#c9a96e] text-[#c9a96e]" : "text-white/40"}`} />}
          label={isStarred ? "Remove star" : "Star"}
          onClick={() => { onStar(messageId); onClose(); }}
        />

        {/* Mark read/unread */}
        <MI
          icon={isRead
            ? <Mail className="h-3.5 w-3.5 text-white/40" />
            : <MailOpen className="h-3.5 w-3.5 text-white/40" />}
          label={isRead ? "Mark as unread" : "Mark as read"}
          onClick={() => { onMarkRead(messageId, !isRead); onClose(); }}
        />

        <Sep />

        {/* Label as — submenu */}
        <div
          className="relative"
          onMouseEnter={() => setSubmenu("label")}
          onMouseLeave={() => setSubmenu(null)}
        >
          <MI
            icon={<Tag className="h-3.5 w-3.5 text-white/40" />}
            label="Label as"
            right={<ChevronRight className="h-3 w-3 text-white/30" />}
          />
          {submenu === "label" && (
            <div
              style={{
                position: "fixed",
                top: my + 72, // approx row offset
                left: subRight ? mx + MENU_W + 4 : mx - SUB_W - 4,
                width: SUB_W,
                zIndex: 100000,
                ...MENU_BG,
              }}
              className="py-1"
            >
              {LABEL_OPTIONS.map((label) => {
                const has = currentLabels.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => { onLabelToggle(messageId, label); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.07] transition-colors"
                  >
                    <Check className={`h-3 w-3 flex-shrink-0 ${has ? "text-[#c9a96e]" : "text-transparent"}`} />
                    <span className={has ? "text-[#c9a96e] font-medium" : "text-white/75"}>{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Move to — submenu */}
        <div
          className="relative"
          onMouseEnter={() => setSubmenu("move")}
          onMouseLeave={() => setSubmenu(null)}
        >
          <MI
            icon={<FolderInput className="h-3.5 w-3.5 text-white/40" />}
            label="Move to"
            right={<ChevronRight className="h-3 w-3 text-white/30" />}
          />
          {submenu === "move" && (
            <div
              style={{
                position: "fixed",
                top: my + 104, // approx row offset
                left: subRight ? mx + MENU_W + 4 : mx - 148 - 4,
                width: 148,
                zIndex: 100000,
                ...MENU_BG,
              }}
              className="py-1"
            >
              {FOLDER_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => { onMoveTo(messageId, f.key); onClose(); }}
                  className="flex w-full items-center px-3 py-2 text-xs text-white/75 hover:bg-white/[0.07] hover:text-white transition-colors"
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Sep />

        {/* Archive */}
        <MI
          icon={<Archive className="h-3.5 w-3.5 text-white/40" />}
          label="Archive"
          onClick={() => { onArchive(messageId); onClose(); }}
        />

        {/* Delete */}
        <MI
          icon={<Trash2 className="h-3.5 w-3.5 text-red-400/70" />}
          label="Delete"
          labelCls="text-red-400"
          onClick={() => { onDelete(messageId); onClose(); }}
        />
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(menu, document.body);
}

function MI({
  icon, label, labelCls, right, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  labelCls?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/[0.07] transition-colors"
    >
      {icon}
      <span className={`flex-1 text-left ${labelCls ?? "text-white/75"}`}>{label}</span>
      {right}
    </button>
  );
}

function Sep() {
  return (
    <div style={{ height: 1, background: "rgba(201,169,110,0.1)", margin: "3px 8px" }} />
  );
}

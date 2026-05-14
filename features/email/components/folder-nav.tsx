"use client";

import { Inbox, Star, AlertCircle, Send, FileText, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxFilters } from "../types";

type Folder = NonNullable<InboxFilters["folder"]>;

const FOLDERS: { key: Folder; label: string; icon: React.ElementType; color?: string }[] = [
  { key: "inbox",     label: "Inbox",     icon: Inbox },
  { key: "starred",   label: "Starred",   icon: Star,         color: "text-amber-400" },
  { key: "important", label: "Important", icon: AlertCircle,  color: "text-red-400" },
  { key: "sent",      label: "Sent",      icon: Send },
  { key: "drafts",    label: "Drafts",    icon: FileText },
  { key: "archive",   label: "Archive",   icon: Archive },
  { key: "trash",     label: "Trash",     icon: Trash2,       color: "text-red-400/70" },
];

interface FolderNavProps {
  current: Folder;
  onChange: (folder: Folder) => void;
}

export function FolderNav({ current, onChange }: FolderNavProps) {
  return (
    <div className="border-b border-white/[0.06] px-2 py-1.5">
      <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
        {FOLDERS.map((f) => {
          const Icon = f.icon;
          const isActive = current === f.key;
          return (
            <button
              key={f.key}
              onClick={() => onChange(f.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : (f.color ?? ""))} />
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

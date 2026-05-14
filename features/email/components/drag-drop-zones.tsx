"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragDropZonesProps {
  visible: boolean;
  onDrop: (action: "archive" | "delete") => void;
}

export function DragDropZones({ visible, onDrop }: DragDropZonesProps) {
  const [hoverZone, setHoverZone] = useState<"archive" | "delete" | null>(null);

  function handleDragOver(e: React.DragEvent, zone: "archive" | "delete") {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setHoverZone(zone);
  }

  function handleDragLeave() {
    setHoverZone(null);
  }

  function handleDrop(e: React.DragEvent, action: "archive" | "delete") {
    e.preventDefault();
    setHoverZone(null);
    onDrop(action);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex gap-2 px-3 py-2 border-t border-white/[0.06] flex-shrink-0",
        !visible && "pointer-events-none"
      )}
    >
      {/* Archive zone */}
      <div
        onDragOver={(e) => handleDragOver(e, "archive")}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, "archive")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 transition-all duration-150",
          hoverZone === "archive"
            ? "border-primary bg-primary/15 scale-[1.02]"
            : "border-white/[0.1] bg-white/[0.02]"
        )}
      >
        <Archive className={cn(
          "h-4 w-4 transition-colors",
          hoverZone === "archive" ? "text-primary" : "text-muted-foreground/50"
        )} />
        <span className={cn(
          "text-xs font-medium transition-colors",
          hoverZone === "archive" ? "text-primary" : "text-muted-foreground/50"
        )}>
          Archive
        </span>
      </div>

      {/* Delete zone */}
      <div
        onDragOver={(e) => handleDragOver(e, "delete")}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, "delete")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 transition-all duration-150",
          hoverZone === "delete"
            ? "border-red-500/60 bg-red-500/10 scale-[1.02]"
            : "border-white/[0.1] bg-white/[0.02]"
        )}
      >
        <Trash2 className={cn(
          "h-4 w-4 transition-colors",
          hoverZone === "delete" ? "text-red-400" : "text-muted-foreground/50"
        )} />
        <span className={cn(
          "text-xs font-medium transition-colors",
          hoverZone === "delete" ? "text-red-400" : "text-muted-foreground/50"
        )}>
          Delete
        </span>
      </div>
    </motion.div>
  );
}

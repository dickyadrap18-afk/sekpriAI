"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import type { EmailAccount } from "@/lib/supabase/types";

interface AccountSwitcherProps {
  accounts: EmailAccount[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
}

const DROPDOWN_STYLE: React.CSSProperties = {
  background: "rgba(14,12,22,0.98)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(201,169,110,0.15)",
  boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
  borderRadius: 10,
  zIndex: 99999,
};

export function AccountSwitcher({ accounts, selectedId, onSelect }: AccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (accounts.length === 0) return null;

  const selected = accounts.find((a) => a.id === selectedId);
  const label = selected ? (selected.display_name || selected.email_address) : "All accounts";

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ x: r.left, y: r.bottom + 4, w: Math.max(r.width, 160) });
    }
    setOpen((v) => !v);
  }

  const dropdown = open && mounted ? createPortal(
    <div
      style={{ position: "fixed", left: pos.x, top: pos.y, minWidth: pos.w, ...DROPDOWN_STYLE }}
      className="py-1"
    >
      {/* All accounts */}
      <button
        onClick={() => { onSelect(undefined); setOpen(false); }}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/[0.07]"
      >
        <Check className={`h-3 w-3 flex-shrink-0 ${!selectedId ? "text-[#c9a96e]" : "text-transparent"}`} />
        <span className={!selectedId ? "text-[#c9a96e] font-medium" : "text-white/60"}>All accounts</span>
      </button>
      {/* Divider */}
      <div style={{ height: 1, background: "rgba(201,169,110,0.08)", margin: "2px 8px" }} />
      {accounts.map((acc) => {
        const isSelected = acc.id === selectedId;
        return (
          <button
            key={acc.id}
            onClick={() => { onSelect(acc.id); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/[0.07]"
          >
            <Check className={`h-3 w-3 flex-shrink-0 ${isSelected ? "text-[#c9a96e]" : "text-transparent"}`} />
            <span className={isSelected ? "text-[#c9a96e] font-medium" : "text-white/60"}>
              {acc.display_name || acc.email_address}
            </span>
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-lg h-7 px-2.5 text-xs transition-all"
        style={{
          background: open ? "rgba(201,169,110,0.08)" : "rgba(255,255,255,0.03)",
          border: open ? "1px solid rgba(201,169,110,0.3)" : "1px solid rgba(255,255,255,0.07)",
          color: open ? "#c9a96e" : "rgba(255,255,255,0.4)",
        }}
        aria-label="Filter by account"
        aria-expanded={open}
      >
        <span className="max-w-[100px] truncate">{label}</span>
        <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {dropdown}
    </>
  );
}

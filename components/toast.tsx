"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let addToastFn: ((message: string, type: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = "info") {
  addToastFn?.(message, type);
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: {
    border: "rgba(74,222,128,0.2)",
    bg: "rgba(74,222,128,0.06)",
    icon: "#4ade80",
    text: "rgba(240,236,228,0.9)",
  },
  error: {
    border: "rgba(248,113,113,0.2)",
    bg: "rgba(248,113,113,0.06)",
    icon: "#f87171",
    text: "rgba(240,236,228,0.9)",
  },
  info: {
    border: "rgba(201,169,110,0.2)",
    bg: "rgba(201,169,110,0.06)",
    icon: "#c9a96e",
    text: "rgba(240,236,228,0.9)",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const s = STYLES[toast.type];
            const Icon = ICONS[toast.type];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl"
                style={{
                  background: `rgba(8,8,16,0.92)`,
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${s.border}`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.6), inset 0 0 0 1px ${s.bg}`,
                }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: s.icon }} />
                <p className="text-sm flex-1 leading-snug" style={{ color: s.text }}>
                  {toast.message}
                </p>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="rounded p-0.5 text-white/20 hover:text-white/60 transition-colors flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}

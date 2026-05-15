"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";

/**
 * Floating banner that appears once when the browser fires `beforeinstallprompt`.
 * Dismissed state is persisted in localStorage so it only shows once per device.
 */
export function PWAInstallPrompt() {
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("pwa-prompt-dismissed") === "1";
  });

  function dismiss() {
    localStorage.setItem("pwa-prompt-dismissed", "1");
    setDismissed(true);
  }

  async function handleInstall() {
    const accepted = await install();
    if (accepted) dismiss();
  }

  const visible = canInstall && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80"
        >
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl"
            style={{
              background: "rgba(8,8,16,0.95)",
              border: "1px solid rgba(201,169,110,0.2)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.2)" }}
            >
              <Smartphone className="h-4 w-4 text-[#c9a96e]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 leading-tight">Install sekpriAI</p>
              <p className="text-xs text-white/35 mt-0.5">Add to home screen for quick access</p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-black transition-all hover:scale-[1.04]"
                style={{ background: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)" }}
              >
                Install
              </button>
              <button
                onClick={dismiss}
                className="rounded-full p-1.5 text-white/25 hover:text-white/60 transition-colors"
                aria-label="Dismiss install prompt"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

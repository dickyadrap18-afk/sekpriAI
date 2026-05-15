"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, MessageSquare, CheckCircle2, ArrowRight,
  ChevronRight, Smartphone,
} from "lucide-react";
import { ConnectImapDialog } from "@/features/settings/components/connect-imap-dialog";
import { createClient } from "@/lib/supabase/client";
import { usePWAInstall } from "@/hooks/use-pwa-install";

interface AccountRow {
  id: string;
  provider: string;
  email_address: string;
  display_name: string | null;
  sync_status: string;
  last_synced_at: string | null;
  created_at: string;
}

const STEPS = [
  { id: "email",    label: "Email",    icon: Mail },
  { id: "telegram", label: "Telegram", icon: MessageSquare },
  { id: "install",  label: "Install",  icon: Smartphone },
  { id: "done",     label: "Done",     icon: CheckCircle2 },
];

const GOLD = "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [connectedAccounts, setConnectedAccounts] = useState<AccountRow[]>([]);
  const [imapOpen, setImapOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const { canInstall, isInstalled, install } = usePWAInstall();

  function handleConnected(account: AccountRow) {
    setConnectedAccounts((prev) => [...prev, account]);
    setImapOpen(false);
  }

  function nextStep() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }

  async function finish() {
    setFinishing(true);
    try {
      // Mark onboarding as done so the callback route never redirects here again
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { onboarding_done: true },
      });
    } catch {
      // Non-fatal — user can still proceed
    }
    router.push("/inbox");
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 text-white"
      style={{ background: "#080810" }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(180,140,60,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="sekpriAI"
            className="h-14 w-auto object-contain mx-auto"
          />
          <p className="text-sm text-white/35 mt-2">Your AI email secretary</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? "20px" : "8px",
                  background:
                    i <= step
                      ? "linear-gradient(90deg, #e8d5b0, #c9a96e)"
                      : "rgba(255,255,255,0.1)",
                }}
              />
            </div>
          ))}
        </div>

        {/* Step label */}
        <p className="text-center text-xs text-white/30 -mt-4 uppercase tracking-[0.2em]">
          Step {step + 1} of {STEPS.length} — {STEPS[step].label}
        </p>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-5 sm:p-6 space-y-5"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(201,169,110,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* ── Step 0: Connect Email ── */}
            {step === 0 && (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Connect your email</h2>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Connect Gmail, Outlook, or any IMAP account. Your secretary will start summarizing and prioritizing emails automatically.
                  </p>
                </div>

                {connectedAccounts.length > 0 && (
                  <div className="space-y-2">
                    {connectedAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                        style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-white/80 truncate">{acc.email_address}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <a
                    href="/api/auth/connect/gmail"
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:scale-[1.01]"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="flex-shrink-0">
                      <rect width="32" height="32" rx="16" fill="#fff"/>
                      <path d="M5 10.5v11A1.5 1.5 0 0 0 6.5 23h19A1.5 1.5 0 0 0 27 21.5v-11L16 18 5 10.5Z" fill="#EA4335"/>
                      <path d="M5 10.5 16 18l11-7.5V9A1.5 1.5 0 0 0 25.5 7.5h-19A1.5 1.5 0 0 0 5 9v1.5Z" fill="#FBBC05"/>
                      <path d="M5 10.5V9A1.5 1.5 0 0 1 6.5 7.5H16v10.5L5 10.5Z" fill="#34A853"/>
                      <path d="M27 10.5V9A1.5 1.5 0 0 0 25.5 7.5H16v10.5l11-7.5Z" fill="#4285F4"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80">Connect Gmail</p>
                      <p className="text-xs text-white/30">OAuth — no password needed</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0" />
                  </a>

                  <button
                    onClick={() => setImapOpen(true)}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:scale-[1.01]"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Mail className="h-5 w-5 text-white/30 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80">Outlook / IMAP</p>
                      <p className="text-xs text-white/30">App password or IMAP credentials</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={nextStep}
                    className="text-xs text-white/25 hover:text-white/50 transition-colors"
                  >
                    Skip for now
                  </button>
                  {connectedAccounts.length > 0 && (
                    <button
                      onClick={nextStep}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-black"
                      style={{ background: GOLD }}
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── Step 1: Telegram ── */}
            {step === 1 && (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Connect Telegram</h2>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Get high-priority alerts and manage your inbox with natural language commands — right from Telegram.
                  </p>
                </div>

                <div
                  className="rounded-xl p-4 space-y-2.5"
                  style={{ background: "rgba(201,169,110,0.04)", border: "1px solid rgba(201,169,110,0.1)" }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                    How to connect
                  </p>
                  <ul className="space-y-2 text-sm text-white/55">
                    <li className="flex items-start gap-2">
                      <span className="text-[#c9a96e] mt-0.5 flex-shrink-0">1.</span>
                      Go to <Link href="/channels" className="text-[#c9a96e]/80 hover:text-[#c9a96e] underline underline-offset-2">Settings → Channels</Link>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#c9a96e] mt-0.5 flex-shrink-0">2.</span>
                      Generate a binding code
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#c9a96e] mt-0.5 flex-shrink-0">3.</span>
                      Send <code className="text-[#c9a96e]/70 bg-white/5 px-1 rounded">/start &lt;code&gt;</code> to the bot
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                  <button
                    onClick={nextStep}
                    className="text-xs text-white/25 hover:text-white/50 transition-colors text-left sm:text-center"
                  >
                    Skip for now
                  </button>
                  <div className="flex gap-2">
                    <Link
                      href="/channels"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      Set up now
                    </Link>
                    <button
                      onClick={nextStep}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-black"
                      style={{ background: GOLD }}
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: PWA Install ── */}
            {step === 2 && (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Install the app</h2>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Add sekpriAI to your home screen for a native app experience — works offline and opens instantly.
                  </p>
                </div>

                {isInstalled ? (
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <p className="text-sm text-white/70">App already installed on this device</p>
                  </div>
                ) : canInstall ? (
                  <button
                    onClick={install}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all hover:scale-[1.01]"
                    style={{ background: GOLD }}
                  >
                    <Smartphone className="h-5 w-5 text-black flex-shrink-0" />
                    <span className="text-sm font-semibold text-black">Add to Home Screen</span>
                  </button>
                ) : (
                  <div
                    className="rounded-xl p-4 space-y-2"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                      Manual install
                    </p>
                    <ul className="space-y-1.5 text-sm text-white/50">
                      <li className="flex items-start gap-2">
                        <span className="text-[#c9a96e] flex-shrink-0">iOS:</span>
                        Tap Share → Add to Home Screen
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#c9a96e] flex-shrink-0">Android:</span>
                        Tap ⋮ → Add to Home Screen
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#c9a96e] flex-shrink-0">Desktop:</span>
                        Click the install icon in the address bar
                      </li>
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={nextStep}
                    className="text-xs text-white/25 hover:text-white/50 transition-colors"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={nextStep}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-black"
                    style={{ background: GOLD }}
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* ── Step 3: Done ── */}
            {step === 3 && (
              <>
                <div className="text-center space-y-3 py-2">
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto"
                    style={{
                      background: "rgba(201,169,110,0.08)",
                      border: "1px solid rgba(201,169,110,0.2)",
                    }}
                  >
                    <CheckCircle2 className="h-8 w-8 text-[#c9a96e]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">You&apos;re all set</h2>
                    <p className="text-sm text-white/40 mt-1 leading-relaxed">
                      Your AI secretary is ready. Emails will be summarized, prioritized, and organized automatically.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "AI summaries on every email",
                    "Priority classification",
                    "Risk detection",
                    "Smart reply drafts",
                    "Memory extraction",
                    "Telegram notifications",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs text-white/40">
                      <CheckCircle2 className="h-3 w-3 text-[#c9a96e]/60 flex-shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>

                <button
                  onClick={finish}
                  disabled={finishing}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-black disabled:opacity-50 transition-all hover:scale-[1.02]"
                  style={{ background: GOLD }}
                >
                  {finishing ? "Setting up…" : "Go to Inbox"}
                  {!finishing && <ArrowRight className="h-4 w-4" />}
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ConnectImapDialog
        open={imapOpen}
        onClose={() => setImapOpen(false)}
        onConnected={handleConnected}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageSquare, CheckCircle2, ArrowRight, ChevronRight } from "lucide-react";
import { ConnectImapDialog } from "@/features/settings/components/connect-imap-dialog";

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
  { id: "email",    label: "Connect Email",   icon: Mail },
  { id: "telegram", label: "Connect Telegram", icon: MessageSquare },
  { id: "done",     label: "You're ready",     icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [connectedAccounts, setConnectedAccounts] = useState<AccountRow[]>([]);
  const [imapOpen, setImapOpen] = useState(false);

  function handleConnected(account: AccountRow) {
    setConnectedAccounts((prev) => [...prev, account]);
    setImapOpen(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push("/inbox");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-mesh">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="sekpriAI" className="h-14 w-auto object-contain mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Your AI email secretary</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full transition-all ${
                i < step ? "bg-primary" : i === step ? "bg-primary scale-125" : "bg-white/[0.1]"
              }`} />
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 transition-all ${i < step ? "bg-primary/50" : "bg-white/[0.08]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5 backdrop-blur-sm"
          >
            {step === 0 && (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Connect your email</h2>
                  <p className="text-sm text-muted-foreground">
                    Connect Gmail, Outlook, or any IMAP account. Your AI secretary will start reading and summarizing emails automatically.
                  </p>
                </div>

                {/* Connected accounts */}
                {connectedAccounts.length > 0 && (
                  <div className="space-y-2">
                    {connectedAccounts.map((acc) => (
                      <div key={acc.id} className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-foreground/80">{acc.email_address}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Connect options */}
                <div className="space-y-2">
                  <button
                    onClick={() => setImapOpen(true)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/[0.1] px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
                  >
                    <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Gmail / Outlook / IMAP</p>
                      <p className="text-xs text-muted-foreground">Connect with App Password</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={next}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now
                  </button>
                  {connectedAccounts.length > 0 && (
                    <button
                      onClick={next}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-all"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Connect Telegram (optional)</h2>
                  <p className="text-sm text-muted-foreground">
                    Get high-priority email notifications and manage your inbox via natural language commands in Telegram.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">How it works</p>
                  <ul className="space-y-1.5 text-sm text-foreground/70">
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">→</span> Go to Settings → Channels → Telegram</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">→</span> Generate a binding code</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">→</span> Send <code className="text-primary/80">/start &lt;code&gt;</code> to the bot</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button onClick={next} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Skip for now
                  </button>
                  <div className="flex gap-2">
                    <Link
                      href="/channels"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
                    >
                      Set up Telegram
                    </Link>
                    <button
                      onClick={next}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-all"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center space-y-3 py-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">You&apos;re all set!</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your AI secretary is ready. Emails will be summarized, prioritized, and organized automatically.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {[
                    "AI summaries on every email",
                    "Priority classification",
                    "Risk detection",
                    "Smart reply drafts",
                    "Memory extraction",
                    "Telegram notifications",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-primary/60 flex-shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push("/inbox")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  Go to Inbox <ArrowRight className="h-4 w-4" />
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

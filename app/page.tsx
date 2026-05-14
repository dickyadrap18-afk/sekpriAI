"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const HeroCanvas = dynamic(
  () => import("@/components/hero-canvas").then((m) => m.HeroCanvas),
  { ssr: false }
);

import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.12,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const FEATURES = [
  {
    icon: "✦",
    label: "Unified Inbox",
    desc: "Gmail, Outlook, IMAP — one elegant view. Zero context switching.",
  },
  {
    icon: "◈",
    label: "AI Summaries",
    desc: "Every email distilled to its essence. Priority, action, deadline — at a glance.",
  },
  {
    icon: "⟡",
    label: "Smart Drafts",
    desc: "Your secretary drafts the reply. You approve. Always your voice, never your time.",
  },
  {
    icon: "◎",
    label: "Telegram Alerts",
    desc: "High-signal notifications only. Your secretary knows what deserves your attention.",
  },
  {
    icon: "⬡",
    label: "Risk Detection",
    desc: "Contracts, payments, legal — flagged before you act. Never caught off guard.",
  },
  {
    icon: "◇",
    label: "AI Memory",
    desc: "Learns your tone, your contacts, your preferences. Gets sharper every day.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── Background layers ── */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
      {/* Radial gold glow center */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(180,140,60,0.07) 0%, transparent 70%)" }} />

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="sekpriAI" className="h-10 w-auto object-contain" />
        <div className="flex items-center gap-2">
          <Link href="/login"
            className="text-sm text-white/40 hover:text-white px-4 py-2 transition-colors">
            Sign in
          </Link>
          <Link href="/signup"
            className="text-sm font-medium border border-[#c9a96e]/40 text-[#c9a96e] hover:bg-[#c9a96e]/10 px-5 py-2 rounded-full transition-all">
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 min-h-[92vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">

        {/* Three.js canvas */}
        <div className="absolute inset-0 z-0">
          <HeroCanvas />
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.85) 100%)" }} />

        {/* Content */}
        <div className="relative z-[2] flex flex-col items-center max-w-4xl">

          {/* Badge */}
          <motion.div
            custom={0} variants={fadeUp} initial="hidden" animate="show"
            className="inline-flex items-center gap-2 rounded-full border border-[#c9a96e]/25 bg-[#c9a96e]/[0.06] px-4 py-1.5 text-xs text-[#c9a96e]/80 tracking-[0.2em] uppercase mb-8"
          >
            <span className="h-1 w-1 rounded-full bg-[#c9a96e]" />
            Personal AI Secretary
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[-0.03em] leading-[1.0] mb-6"
          >
            Your inbox,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 40%, #a07840 100%)" }}
            >
              handled.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            custom={2} variants={fadeUp} initial="hidden" animate="show"
            className="text-base sm:text-lg text-white/40 max-w-lg leading-relaxed mb-10"
          >
            sekpriAI is your private AI secretary — reading, summarizing,
            and drafting replies so you only touch what matters.
          </motion.p>

          {/* CTA */}
          <motion.div
            custom={3} variants={fadeUp} initial="hidden" animate="show"
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <Link href="/signup"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-black transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)" }}
            >
              Start for free
              <span className="text-black/50">→</span>
            </Link>
            <Link href="/login"
              className="inline-flex items-center rounded-full border border-white/10 text-white/50 text-sm px-8 py-3 hover:border-white/20 hover:text-white transition-all">
              Sign in
            </Link>
          </motion.div>

          <motion.p
            custom={4} variants={fadeUp} initial="hidden" animate="show"
            className="mt-5 text-xs text-white/20 tracking-widest uppercase"
          >
            No credit card required
          </motion.p>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2] flex flex-col items-center gap-1"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="h-8 w-px bg-gradient-to-b from-transparent via-[#c9a96e]/40 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <hr className="line-fade" />
      </div>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#c9a96e]/60 mb-4">
            What your secretary does
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Not just email.{" "}
            <span className="text-white/30">Intelligent email.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.08), rgba(255,255,255,0.04))", borderRadius: "16px", overflow: "hidden" }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ backgroundColor: "rgba(201,169,110,0.04)" }}
              className="bg-black p-7 space-y-3 transition-colors cursor-default"
            >
              <span className="text-xl text-[#c9a96e]/60">{f.icon}</span>
              <p className="text-sm font-semibold text-white tracking-wide">{f.label}</p>
              <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <hr className="line-fade" />
      </div>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 py-32 gap-7 overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(180,140,60,0.08) 0%, transparent 70%)" }} />

        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-[11px] uppercase tracking-[0.25em] text-[#c9a96e]/50"
        >
          Ready when you are
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight max-w-xl"
        >
          Your secretary is waiting.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-white/35 text-sm max-w-sm leading-relaxed"
        >
          Connect your inbox in under a minute. No setup, no noise.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.3 }}
        >
          <Link href="/signup"
            className="inline-flex items-center gap-2 rounded-full px-10 py-3.5 text-sm font-semibold text-black transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)" }}
          >
            Create free account
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.05] px-6 py-7 max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="sekpriAI" className="h-6 w-auto object-contain opacity-40" />
        <p className="text-xs text-white/20">© 2026 sekpriAI. All rights reserved.</p>
      </footer>
    </main>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(searchParams.get("error") || "");
  const [message] = useState(searchParams.get("message") || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed."); setLoading(false); return; }
      router.push("/inbox");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(180,140,60,0.06) 0%, transparent 70%)" }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="sekpriAI" className="h-8 w-auto object-contain" />
        </Link>
        <p className="text-sm text-white/30">
          No account?{" "}
          <Link href="/signup" className="text-[#c9a96e]/80 hover:text-[#c9a96e] transition-colors">
            Sign up
          </Link>
        </p>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">

        {/* Logo — large */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="sekpriAI" className="h-28 w-auto object-contain" />
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* Heading */}
          <div className="text-center mb-8 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-white/35">Sign in to your secretary</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-lg border border-[#c9a96e]/20 bg-[#c9a96e]/[0.05] px-4 py-3 text-sm text-[#c9a96e]/70" role="status">
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.18em]">
                Email
              </label>
              <input
                id="email" name="email" type="email" required autoComplete="email"
                className="input-base"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.18em]">
                Password
              </label>
              <input
                id="password" name="password" type="password" required minLength={6}
                autoComplete="current-password"
                className="input-base"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full rounded-full py-2.5 text-sm font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{ background: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/20">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#c9a96e]/60 hover:text-[#c9a96e] transition-colors">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}

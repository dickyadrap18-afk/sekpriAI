"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

      if (!res.ok) {
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/inbox");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Dot grid */}
      <div className="fixed inset-0 bg-grid opacity-100 pointer-events-none" />

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="sekpriAI" className="h-7 w-auto object-contain" />
        </Link>
        <p className="text-sm text-white/40">
          No account?{" "}
          <Link href="/signup" className="text-white hover:text-white/70 transition-colors">
            Sign up
          </Link>
        </p>
      </nav>

      {/* Form */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
            <p className="text-sm text-white/40">Welcome back to sekpriAI</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60" role="status">
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-white/40 uppercase tracking-widest">
                Email
              </label>
              <input
                id="email" name="email" type="email" required autoComplete="email"
                className="input-base"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-white/40 uppercase tracking-widest">
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
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black text-sm font-semibold py-2.5 rounded-md hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/20">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <p className="text-center text-xs text-white/25">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-white/50 hover:text-white transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(searchParams.get("error") || "");
  const [loading, setLoading] = useState(false);

  // Handle OAuth callback code
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleOAuthCallback(code);
    }
  }, [searchParams]);

  async function handleOAuthCallback(code: string) {
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        setError("Authentication failed. Please try again.");
        setLoading(false);
      } else {
        router.push("/inbox");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed."); setLoading(false); return; }
      if (data.needsConfirmation) {
        router.push(`/login?message=${encodeURIComponent(data.message)}`);
        return;
      }
      router.push("/inbox");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError("");
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Supabase will redirect here after Google auth completes.
          // This must be listed in Supabase Dashboard → Auth → URL Configuration → Redirect URLs.
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setError("Failed to initiate Google signup.");
        setLoading(false);
      }
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
          Have an account?{" "}
          <Link href="/login" className="text-[#c9a96e]/80 hover:text-[#c9a96e] transition-colors">
            Sign in
          </Link>
        </p>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">

        {/* Logo — large */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="mb-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="sekpriAI" className="h-28 w-auto object-contain" />
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="w-full max-w-sm"
        >
          {/* Heading */}
          <div className="text-center mb-8 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
            <p className="text-sm text-white/35">Your personal AI secretary awaits</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400" role="alert">
              {error}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full rounded-full py-2.5 text-sm font-semibold bg-white text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? "Connecting..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-2 text-white/30">Or continue with email</span>
            </div>
          </div>

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
                autoComplete="new-password"
                className="input-base"
                placeholder="Min. 6 characters"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full rounded-full py-2.5 text-sm font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{ background: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)" }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/20">
            Already have an account?{" "}
            <Link href="/login" className="text-[#c9a96e]/60 hover:text-[#c9a96e] transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>;
}

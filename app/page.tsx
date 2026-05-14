import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">sekpriAI</h1>
        <p className="text-lg text-muted-foreground">
          Your AI-first email secretary. Unified inbox, smart summaries,
          priority classification, and Telegram integration.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}

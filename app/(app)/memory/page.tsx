import { Suspense } from "react";
import { MemoryView } from "@/features/memory/components/memory-view";
import { ErrorBoundary } from "@/components/error-boundary";

function MemorySkeleton() {
  return (
    <div className="space-y-5">
      {/* Tabs skeleton */}
      <div className="flex gap-0.5 pb-px" style={{ borderBottom: "1px solid rgba(201,169,110,0.08)" }}>
        {["Pending", "Active", "Rejected"].map((t) => (
          <div key={t} className="px-4 py-2.5">
            <div className="h-3.5 w-14 rounded-full shimmer" />
          </div>
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-3.5"
            style={{ background: "rgba(8,8,16,0.4)", border: "1px solid rgba(255,255,255,0.04)", opacity: 1 - i * 0.15 }}>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 rounded-full shimmer" />
              <div className="h-3 w-full rounded-full shimmer" />
              <div className="h-3 w-2/3 rounded-full shimmer" />
            </div>
            <div className="flex gap-1">
              <div className="h-7 w-7 rounded-lg shimmer" />
              <div className="h-7 w-7 rounded-lg shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MemoryPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">AI Memory</h1>
        <p className="text-sm text-white/35">
          Review and manage what your secretary has learned about you.
        </p>
      </div>
      <ErrorBoundary>
        <Suspense fallback={<MemorySkeleton />}>
          <MemoryView />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

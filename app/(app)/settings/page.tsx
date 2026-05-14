import { Suspense } from "react";
import { SettingsView } from "@/features/settings/components/settings-view";
import { ErrorBoundary } from "@/components/error-boundary";

function SettingsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <div className="space-y-2">
        <div className="h-6 w-24 rounded-full shimmer" />
        <div className="h-3 w-64 rounded-full shimmer" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-40 rounded-full shimmer" />
            <div className="h-3 w-56 rounded-full shimmer" />
          </div>
          <div className="h-8 w-28 rounded-lg shimmer" />
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,169,110,0.07)" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3"
              style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.04)" } : {}}>
              <div className="h-9 w-9 rounded-full shimmer flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-36 rounded-full shimmer" />
                <div className="h-3 w-48 rounded-full shimmer" />
              </div>
              <div className="h-5 w-20 rounded-full shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Settings page is fully client-side — no server fetch needed at page level.
// SettingsView fetches accounts itself via Supabase client.
// This makes navigation to /settings instant.
export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsView initialAccounts={[]} />
      </Suspense>
    </ErrorBoundary>
  );
}

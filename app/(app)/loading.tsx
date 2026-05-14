/**
 * App-level loading UI — shown instantly during page transitions.
 * Next.js App Router shows this while the new page is loading.
 * Keeps the sidebar visible and shows a subtle content skeleton.
 */
export default function AppLoading() {
  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 animate-pulse">
      <div className="h-6 w-48 rounded-lg bg-white/[0.04]" />
      <div className="h-4 w-72 rounded-lg bg-white/[0.03]" />
      <div className="space-y-3 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-white/[0.03]"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

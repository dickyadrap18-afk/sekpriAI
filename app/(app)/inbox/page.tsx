import { InboxView } from "@/features/email/components/inbox-view";

export default function InboxPage() {
  return (
    // Mobile: subtract mobile header (h-14). Desktop: full height (no header rendered).
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen">
      <InboxView />
    </div>
  );
}

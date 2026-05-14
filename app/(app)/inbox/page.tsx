import { Suspense } from "react";
import { InboxView } from "@/features/email/components/inbox-view";

export default function InboxPage() {
  return (
    <div className="h-full">
      <Suspense>
        <InboxView />
      </Suspense>
    </div>
  );
}

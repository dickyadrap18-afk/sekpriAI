import { Suspense } from "react";
import { TelegramBinding } from "@/features/channels/telegram/components/telegram-binding";
import { WhatsAppMock } from "@/features/channels/whatsapp/components/whatsapp-mock";
import { ErrorBoundary } from "@/components/error-boundary";

function SectionSkeleton() {
  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{ background: "rgba(8,8,16,0.5)", border: "1px solid rgba(201,169,110,0.07)" }}>
      <div className="h-4 w-32 rounded-full shimmer" />
      <div className="h-3 w-48 rounded-full shimmer" />
    </div>
  );
}

export default function ChannelsPage() {
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-10">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Channels</h1>
        <p className="text-sm text-white/35">
          Connect messaging channels to receive notifications and manage email via natural language.
        </p>
      </div>

      {/* Telegram */}
      <section className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-white/80">Telegram</h2>
          <p className="text-xs text-white/30">
            Receive high-priority notifications and send commands directly from Telegram.
          </p>
        </div>
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <TelegramBinding />
          </Suspense>
        </ErrorBoundary>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.1), transparent)" }} />

      {/* WhatsApp Mock */}
      <section className="space-y-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white/80">WhatsApp</h2>
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)", color: "#c9a96e" }}>
              Demo
            </span>
          </div>
          <p className="text-xs text-white/30">
            Simulated WhatsApp chat — same AI commands as Telegram. No real WhatsApp API.
          </p>
        </div>
        <ErrorBoundary>
          <WhatsAppMock />
        </ErrorBoundary>
      </section>
    </div>
  );
}

import { TelegramBinding } from "@/features/channels/telegram/components/telegram-binding";
import { WhatsAppMock } from "@/features/channels/whatsapp/components/whatsapp-mock";

export default function ChannelsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-xl font-semibold">Channels</h1>

      {/* Telegram */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">Telegram</h2>
        <p className="text-sm text-muted-foreground">
          Connect your Telegram account to receive high-priority notifications
          and manage email via natural language commands.
        </p>
        <TelegramBinding />
      </section>

      {/* WhatsApp Mock */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">WhatsApp (Demo)</h2>
        <p className="text-sm text-muted-foreground">
          This is a simulated WhatsApp chat to demonstrate future channel
          expansion. No real WhatsApp API is used.
        </p>
        <WhatsAppMock />
      </section>
    </div>
  );
}

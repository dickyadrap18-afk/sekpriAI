export default function ChannelsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Channels</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>Connect Telegram or try the WhatsApp mock chat.</p>
        <p className="text-sm mt-2">
          Channels let you manage email via natural language commands.
        </p>
      </div>
    </div>
  );
}

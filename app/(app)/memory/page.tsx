export default function MemoryPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">AI Memory</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>Memory items extracted by AI will appear here.</p>
        <p className="text-sm mt-2">
          Pending items require your approval before activation.
        </p>
      </div>
    </div>
  );
}

import { MemoryView } from "@/features/memory/components/memory-view";

export default function MemoryPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">AI Memory</h1>
      <MemoryView />
    </div>
  );
}

import { MemoryView } from "@/features/memory/components/memory-view";

export default function MemoryPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">AI Memory</h1>
      <MemoryView />
    </div>
  );
}

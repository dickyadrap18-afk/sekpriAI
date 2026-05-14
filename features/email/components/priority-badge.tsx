import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: "high" | "medium" | "low" | null;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        priority === "high" && "bg-red-100 text-red-700",
        priority === "medium" && "bg-amber-100 text-amber-700",
        priority === "low" && "bg-slate-100 text-slate-600"
      )}
    >
      {priority}
    </span>
  );
}

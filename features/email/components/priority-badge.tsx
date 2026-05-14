import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: "high" | "medium" | "low" | null;
  size?: "sm" | "md";
}

export function PriorityBadge({ priority, size = "sm" }: PriorityBadgeProps) {
  if (!priority) return null;

  return (
    <span
      className={cn(
        "inline-flex flex-shrink-0 items-center rounded-full font-medium tracking-wide uppercase",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        priority === "high"   && "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
        priority === "medium" && "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
        priority === "low"    && "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20"
      )}
    >
      {priority === "high" && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />}
      {priority}
    </span>
  );
}

const styles: Record<string, { label: string; className: string }> = {
  HIGH: { label: "Prioridad alta", className: "bg-rose-100 text-rose-700" },
  LOW: { label: "Prioridad baja", className: "bg-zinc-100 text-zinc-600" },
};

// Medium is the default/"normal" priority, so it's left unlabeled — only the
// extremes (HIGH/LOW) are worth calling out.
export function PriorityBadge({ priority }: { priority: "LOW" | "MEDIUM" | "HIGH" }) {
  if (priority === "MEDIUM") return null;
  const style = styles[priority];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

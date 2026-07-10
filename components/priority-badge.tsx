const styles: Record<string, { label: string; className: string }> = {
  HIGH: { label: "Prioridad alta", className: "bg-rose-100 text-rose-700" },
  MEDIUM: { label: "Prioridad media", className: "bg-amber-100 text-amber-700" },
  LOW: { label: "Prioridad baja", className: "bg-zinc-100 text-zinc-600" },
};

export function PriorityBadge({ priority }: { priority: "LOW" | "MEDIUM" | "HIGH" }) {
  const style = styles[priority];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

import { categorySwatchClassesOrNeutral } from "@/lib/categories";

export function categoryAnchorId(categoryId: string | null) {
  return `categoria-${categoryId ?? "sin-categoria"}`;
}

export function CategoryIndex({
  groups,
}: {
  groups: { id: string | null; name: string; color: string | null }[];
}) {
  // Nothing to jump between with zero or one section.
  if (groups.length < 2) return null;

  return (
    <nav
      aria-label="Categorías"
      // Hugs the left edge of the centered max-w-2xl content column instead
      // of the viewport edge: offset from center by half the content width
      // (21rem) plus this nav's own width (10rem, `w-40`) plus a 1rem gap —
      // 32rem total, chosen so it lines up exactly at the `lg` breakpoint
      // (1024px = 64rem, so 50% = 32rem there) instead of overlapping the
      // content at the narrow end of `lg`, e.g. a 1024px-wide iPad.
      className="fixed left-[calc(50%_-_32rem)] top-1/2 z-10 hidden w-40 -translate-y-1/2 flex-col gap-0.5 rounded-xl border border-zinc-200 bg-white/90 p-2 text-sm shadow-sm backdrop-blur lg:flex"
    >
      {groups.map((group) => (
        <a
          key={group.id ?? "sin-categoria"}
          href={`#${categoryAnchorId(group.id)}`}
          className="flex items-center gap-2 truncate rounded-lg px-2 py-1 font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${categorySwatchClassesOrNeutral(group.color)}`}
          />
          <span className="truncate">{group.name}</span>
        </a>
      ))}
    </nav>
  );
}

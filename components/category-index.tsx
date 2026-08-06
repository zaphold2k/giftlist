import { categorySwatchClasses } from "@/lib/categories";

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
      className="fixed left-4 top-1/2 z-10 hidden max-w-[10rem] -translate-y-1/2 flex-col gap-0.5 rounded-xl border border-zinc-200 bg-white/90 p-2 text-sm shadow-sm backdrop-blur lg:flex"
    >
      {groups.map((group) => (
        <a
          key={group.id ?? "sin-categoria"}
          href={`#${categoryAnchorId(group.id)}`}
          className="flex items-center gap-2 truncate rounded-lg px-2 py-1 font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              group.color ? categorySwatchClasses(group.color) : "bg-zinc-300"
            }`}
          />
          <span className="truncate">{group.name}</span>
        </a>
      ))}
    </nav>
  );
}

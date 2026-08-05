import { CATEGORY_LABELS, type ItemCategory } from "@/lib/categories";

export function CategoryBadge({ category }: { category: ItemCategory | null }) {
  if (!category) return null;
  return (
    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
      {CATEGORY_LABELS[category]}
    </span>
  );
}

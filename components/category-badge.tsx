import { categoryBadgeClasses } from "@/lib/categories";

export function CategoryBadge({
  category,
}: {
  category: { name: string; color: string } | null;
}) {
  if (!category) return null;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryBadgeClasses(category.color)}`}
    >
      {category.name}
    </span>
  );
}

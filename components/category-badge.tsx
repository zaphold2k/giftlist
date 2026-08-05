export function CategoryBadge({ category }: { category: { name: string } | null }) {
  if (!category) return null;
  return (
    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
      {category.name}
    </span>
  );
}

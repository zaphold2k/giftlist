// Curated palette instead of a free color picker: every entry is a matched
// bg-*-100/text-*-700 pair (badge) and bg-*-400 (swatch), chosen so the
// badge text stays legible without computing contrast at runtime. Stored as
// plain strings on Category.color (not a DB enum) so the palette can grow
// without a migration.
export const CATEGORY_COLORS = [
  "rose",
  "orange",
  "amber",
  "emerald",
  "sky",
  "violet",
  "fuchsia",
  "zinc",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const DEFAULT_CATEGORY_COLOR: CategoryColor = "sky";

const CATEGORY_COLOR_BADGE_CLASSES: Record<CategoryColor, string> = {
  rose: "bg-rose-100 text-rose-700",
  orange: "bg-orange-100 text-orange-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700",
  zinc: "bg-zinc-100 text-zinc-700",
};

const CATEGORY_COLOR_SWATCH_CLASSES: Record<CategoryColor, string> = {
  rose: "bg-rose-400",
  orange: "bg-orange-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  fuchsia: "bg-fuchsia-400",
  zinc: "bg-zinc-400",
};

function isCategoryColor(value: string): value is CategoryColor {
  return (CATEGORY_COLORS as readonly string[]).includes(value);
}

// Category.color is a free-text column, not a DB-level enum, so a value that
// predates a palette change (or was tampered with) needs a safe fallback
// rather than an undefined lookup. Shared by every place that needs a
// "guaranteed valid" CategoryColor from a raw stored/submitted string —
// don't reimplement the CATEGORY_COLORS.includes check elsewhere.
export function toCategoryColor(color: string): CategoryColor {
  return isCategoryColor(color) ? color : DEFAULT_CATEGORY_COLOR;
}

export function categoryBadgeClasses(color: string): string {
  return CATEGORY_COLOR_BADGE_CLASSES[toCategoryColor(color)];
}

export function categorySwatchClasses(color: string): string {
  return CATEGORY_COLOR_SWATCH_CLASSES[toCategoryColor(color)];
}

// For "uncategorized" spots (no Category at all, color is null) rather than
// a mis-stored color string — a neutral gray, not silently DEFAULT_CATEGORY_COLOR,
// so "no category" stays visually distinct from a real category colored sky.
export function categorySwatchClassesOrNeutral(color: string | null): string {
  return color ? categorySwatchClasses(color) : "bg-zinc-300";
}

// Seeded onto every new list (see createList in the dashboard actions) —
// from there on, each list's admins can rename/recolor/add/delete their own
// categories freely via the Category model. This is just the starting set.
export const DEFAULT_CATEGORIES: { name: string; color: CategoryColor }[] = [
  { name: "Ropa", color: "violet" },
  { name: "Juguetes", color: "amber" },
  { name: "Higiene y cuidado", color: "sky" },
  { name: "Alimentación", color: "emerald" },
  { name: "Paseo", color: "orange" },
  { name: "Habitación", color: "fuchsia" },
  { name: "Otros", color: "zinc" },
];

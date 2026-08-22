// Priority as a literal union, not Prisma's generated Priority type — same
// convention as components/priority-badge.tsx, so this module has no
// dependency on the Prisma client.
const PRIORITY_WEIGHT: Record<"LOW" | "MEDIUM" | "HIGH", number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

type OrderableItem = {
  priority: "LOW" | "MEDIUM" | "HIGH";
  quantityWanted: number;
  position: number;
  reservations: { id: string }[];
};

/**
 * Units of an item not covered by an active reservation. Shared between the
 * sort below and the public-view render (app/l/[slug]/page.tsx) so both
 * agree on what "remaining" means if reservation-counting semantics change.
 */
export function remainingUnits(item: { quantityWanted: number; reservations: { id: string }[] }): number {
  return item.quantityWanted - item.reservations.length;
}

/**
 * Sort order for the public list view, within a category section:
 * 1. Items still available (remaining > 0) before fully reserved ones.
 * 2. Priority, HIGH before MEDIUM before LOW.
 * 3. Remaining units (quantityWanted minus active reservations), descending.
 * 4. `position`, ascending, as a stable final tiebreaker.
 * Returns a new array; does not mutate `items`.
 */
export function sortItemsForPublicView<T extends OrderableItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const remainingA = remainingUnits(a);
    const remainingB = remainingUnits(b);

    const availableA = remainingA > 0;
    const availableB = remainingB > 0;
    if (availableA !== availableB) return availableA ? -1 : 1;

    const priorityDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    if (remainingB !== remainingA) return remainingB - remainingA;

    return a.position - b.position;
  });
}

import { describe, expect, it } from "vitest";
import { sortItemsForPublicView } from "@/lib/item-order";

function item(overrides: {
  id: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  quantityWanted?: number;
  position?: number;
  reservedCount?: number;
}) {
  const { id, priority = "MEDIUM", quantityWanted = 1, position = 0, reservedCount = 0 } = overrides;
  return {
    id,
    priority,
    quantityWanted,
    position,
    reservations: Array.from({ length: reservedCount }, (_, i) => ({ id: `${id}-res-${i}` })),
  };
}

describe("sortItemsForPublicView", () => {
  it("puts available items before fully reserved ones, regardless of priority", () => {
    const reservedHigh = item({ id: "reserved-high", priority: "HIGH", quantityWanted: 1, reservedCount: 1 });
    const availableLow = item({ id: "available-low", priority: "LOW", quantityWanted: 1, reservedCount: 0 });

    const sorted = sortItemsForPublicView([reservedHigh, availableLow]);

    expect(sorted.map((i) => i.id)).toEqual(["available-low", "reserved-high"]);
  });

  it("orders by priority HIGH before MEDIUM before LOW among available items", () => {
    const low = item({ id: "low", priority: "LOW" });
    const high = item({ id: "high", priority: "HIGH" });
    const medium = item({ id: "medium", priority: "MEDIUM" });

    const sorted = sortItemsForPublicView([low, high, medium]);

    expect(sorted.map((i) => i.id)).toEqual(["high", "medium", "low"]);
  });

  it("ranks priority as a strictly higher-precedence tier than remaining units", () => {
    // A HIGH item with little left must still outrank a LOW item with lots
    // left — priority is a hard tier, not folded into a weighted score with
    // remaining units.
    const highFewRemaining = item({ id: "high-few", priority: "HIGH", quantityWanted: 1, reservedCount: 0 });
    const lowManyRemaining = item({ id: "low-many", priority: "LOW", quantityWanted: 5, reservedCount: 0 });

    const sorted = sortItemsForPublicView([lowManyRemaining, highFewRemaining]);

    expect(sorted.map((i) => i.id)).toEqual(["high-few", "low-many"]);
  });

  it("breaks a priority tie by remaining units descending", () => {
    const fewRemaining = item({ id: "few", priority: "MEDIUM", quantityWanted: 3, reservedCount: 2 });
    const manyRemaining = item({ id: "many", priority: "MEDIUM", quantityWanted: 3, reservedCount: 0 });

    const sorted = sortItemsForPublicView([fewRemaining, manyRemaining]);

    expect(sorted.map((i) => i.id)).toEqual(["many", "few"]);
  });

  it("breaks a total tie by position ascending", () => {
    const second = item({ id: "second", position: 2 });
    const first = item({ id: "first", position: 1 });

    const sorted = sortItemsForPublicView([second, first]);

    expect(sorted.map((i) => i.id)).toEqual(["first", "second"]);
  });

  it("does not mutate the input array", () => {
    const items = [item({ id: "b", position: 1 }), item({ id: "a", position: 0 })];
    const original = [...items];

    sortItemsForPublicView(items);

    expect(items).toEqual(original);
  });
});

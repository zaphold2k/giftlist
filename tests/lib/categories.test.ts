import { describe, expect, it } from "vitest";
import {
  CATEGORY_COLORS,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_COLOR,
  categoryBadgeClasses,
  categorySwatchClasses,
  categorySwatchClassesOrNeutral,
  toCategoryColor,
} from "@/lib/categories";

describe("toCategoryColor", () => {
  it("returns the color unchanged when it is in the palette", () => {
    expect(toCategoryColor("rose")).toBe("rose");
  });

  it("falls back to the default for a value outside the palette", () => {
    expect(toCategoryColor("not-a-real-color")).toBe(DEFAULT_CATEGORY_COLOR);
  });
});

describe("categoryBadgeClasses / categorySwatchClasses", () => {
  it("returns a literal bg-*/text-* pair for every palette color", () => {
    for (const color of CATEGORY_COLORS) {
      expect(categoryBadgeClasses(color)).toMatch(/^bg-\S+ text-\S+$/);
      expect(categorySwatchClasses(color)).toMatch(/^bg-\S+$/);
    }
  });

  it("falls back to the default color's classes for an unknown stored value", () => {
    expect(categoryBadgeClasses("unknown")).toBe(categoryBadgeClasses(DEFAULT_CATEGORY_COLOR));
  });
});

describe("categorySwatchClassesOrNeutral", () => {
  it("returns a neutral swatch for null (uncategorized), not the default color", () => {
    const neutral = categorySwatchClassesOrNeutral(null);
    expect(neutral).not.toBe(categorySwatchClasses(DEFAULT_CATEGORY_COLOR));
  });

  it("resolves a real color when one is stored", () => {
    expect(categorySwatchClassesOrNeutral("rose")).toBe(categorySwatchClasses("rose"));
  });
});

describe("DEFAULT_CATEGORIES", () => {
  it("only uses colors from the curated palette", () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(CATEGORY_COLORS).toContain(category.color);
    }
  });
});

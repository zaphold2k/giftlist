import { describe, expect, it } from "vitest";
import {
  addAdminSchema,
  categorySchema,
  itemLinkSchema,
  itemSchema,
  listSchema,
  loginSchema,
  registerSchema,
  reservationSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Ana",
      email: "ana@example.com",
      password: "supersecreta1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Ana",
      email: "ana@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Ana",
      email: "not-an-email",
      password: "supersecreta1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "ana@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("listSchema", () => {
  it("allows an empty description and eventDate", () => {
    const result = listSchema.safeParse({ title: "Lista", description: "", eventDate: "" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = listSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

describe("itemSchema", () => {
  it("defaults priority to MEDIUM and quantityWanted to 1", () => {
    const result = itemSchema.safeParse({ name: "Body" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("MEDIUM");
      expect(result.data.quantityWanted).toBe(1);
    }
  });

  it("rejects a quantityWanted above the max", () => {
    const result = itemSchema.safeParse({ name: "Body", quantityWanted: 100 });
    expect(result.success).toBe(false);
  });

  it("accepts an empty imageUrl but rejects an invalid one", () => {
    expect(itemSchema.safeParse({ name: "Body", imageUrl: "" }).success).toBe(true);
    expect(itemSchema.safeParse({ name: "Body", imageUrl: "not-a-url" }).success).toBe(false);
  });
});

describe("itemLinkSchema", () => {
  it("requires a valid url but label is optional", () => {
    expect(itemLinkSchema.safeParse({ url: "https://example.com" }).success).toBe(true);
    expect(itemLinkSchema.safeParse({ label: "Tienda", url: "not-a-url" }).success).toBe(false);
  });
});

describe("addAdminSchema", () => {
  it("requires a valid email", () => {
    expect(addAdminSchema.safeParse({ email: "ana@example.com" }).success).toBe(true);
    expect(addAdminSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("categorySchema", () => {
  it("defaults color to the default palette color", () => {
    const result = categorySchema.safeParse({ name: "Ropa" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.color).toBe("sky");
  });

  it("rejects a color outside the curated palette", () => {
    const result = categorySchema.safeParse({ name: "Ropa", color: "cyan" });
    expect(result.success).toBe(false);
  });
});

describe("reservationSchema", () => {
  it("requires a guest name but email and message are optional", () => {
    expect(reservationSchema.safeParse({ guestName: "Juan" }).success).toBe(true);
    expect(reservationSchema.safeParse({ guestName: "" }).success).toBe(false);
    expect(
      reservationSchema.safeParse({ guestName: "Juan", guestEmail: "not-an-email" }).success
    ).toBe(false);
  });
});

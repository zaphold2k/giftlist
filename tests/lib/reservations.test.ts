import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ReservationFullError, reserveItem } from "@/lib/reservations";
import { createItem, createList, createParent } from "../helpers/factories";

async function reserveInParallel(itemId: string, count: number) {
  return Promise.allSettled(
    Array.from({ length: count }, (_, i) =>
      reserveItem({ itemId, guestName: `Invitado ${i}` })
    )
  );
}

describe("reserveItem concurrency", () => {
  it("lets exactly one guest reserve an item with quantityWanted 1", async () => {
    const parent = await createParent();
    const list = await createList(parent.id);
    const item = await createItem(list.id, { quantityWanted: 1 });

    const results = await reserveInParallel(item.id, 10);

    const ok = results.filter((r) => r.status === "fulfilled");
    const full = results.filter(
      (r) => r.status === "rejected" && r.reason instanceof ReservationFullError
    );
    expect(ok).toHaveLength(1);
    expect(full).toHaveLength(9);

    const active = await prisma.reservation.count({
      where: { itemId: item.id, status: "ACTIVE" },
    });
    expect(active).toBe(1);
  });

  it("caps successful reservations at quantityWanted for a multi-unit item", async () => {
    const parent = await createParent();
    const list = await createList(parent.id);
    const item = await createItem(list.id, { quantityWanted: 3 });

    const results = await reserveInParallel(item.id, 10);

    const ok = results.filter((r) => r.status === "fulfilled");
    const full = results.filter(
      (r) => r.status === "rejected" && r.reason instanceof ReservationFullError
    );
    expect(ok).toHaveLength(3);
    expect(full).toHaveLength(7);

    const active = await prisma.reservation.count({
      where: { itemId: item.id, status: "ACTIVE" },
    });
    expect(active).toBe(3);
  });

  it("rejects reservations for an item that no longer exists", async () => {
    await expect(
      reserveItem({ itemId: "nonexistent-id", guestName: "Invitado" })
    ).rejects.toThrow("El artículo ya no existe");
  });
});

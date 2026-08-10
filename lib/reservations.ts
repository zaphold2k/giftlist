import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { Prisma } from "@/app/generated/prisma/client";

export class ReservationFullError extends Error {
  constructor() {
    super("Este artículo ya está completamente reservado");
    this.name = "ReservationFullError";
  }
}

/**
 * Reserve one unit of an item on behalf of a guest (no account).
 *
 * Concurrency: the count-check-insert runs inside a single transaction.
 * SQLite serializes write transactions (one writer at a time), so two
 * concurrent calls cannot both observe a free slot; the loser either waits
 * (busy_timeout) and sees the committed state, or fails with a write
 * conflict that withRetry re-runs. As a last line of defense, the partial
 * unique index on (itemId, unitSlot) WHERE status='ACTIVE' turns any
 * double-booking into a P2002 constraint violation.
 */
export async function reserveItem(input: {
  itemId: string;
  guestName: string;
  guestEmail?: string;
  message?: string;
}) {
  try {
    return await withRetry(() =>
      prisma.$transaction(async (tx) => {
        const item = await tx.giftItem.findUnique({
          where: { id: input.itemId },
          select: { quantityWanted: true },
        });
        if (!item) throw new Error("El artículo ya no existe");

        const active = await tx.reservation.findMany({
          where: { itemId: input.itemId, status: "ACTIVE" },
          select: { unitSlot: true },
        });
        if (active.length >= item.quantityWanted) throw new ReservationFullError();

        const taken = new Set(active.map((r) => r.unitSlot));
        let unitSlot = 0;
        while (taken.has(unitSlot)) unitSlot++;
        if (unitSlot >= item.quantityWanted) throw new ReservationFullError();

        return tx.reservation.create({
          data: {
            itemId: input.itemId,
            unitSlot,
            guestName: input.guestName,
            guestEmail: input.guestEmail || null,
            message: input.message || null,
          },
        });
      })
    );
  } catch (error) {
    // Partial unique index violation: someone else grabbed the slot in a
    // race the transaction logic didn't catch. Same outcome for the guest.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ReservationFullError();
    }
    throw error;
  }
}

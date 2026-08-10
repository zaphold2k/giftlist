/**
 * Concurrency check for reservations: fires N parallel reserveItem calls per
 * item and asserts that exactly quantityWanted of them succeed.
 * Run with: npx tsx scripts/test-concurrency.ts
 */
import { prisma } from "../lib/prisma";
import { reserveItem, ReservationFullError } from "../lib/reservations";

async function testItem(itemId: string, quantityWanted: number, parallel: number) {
  await prisma.reservation.deleteMany({ where: { itemId } });

  const results = await Promise.allSettled(
    Array.from({ length: parallel }, (_, i) =>
      reserveItem({ itemId, guestName: `Invitado ${i}` })
    )
  );

  const ok = results.filter((r) => r.status === "fulfilled").length;
  const full = results.filter(
    (r) => r.status === "rejected" && r.reason instanceof ReservationFullError
  ).length;
  const otherErrors = results.filter(
    (r) => r.status === "rejected" && !(r.reason instanceof ReservationFullError)
  );

  const active = await prisma.reservation.count({
    where: { itemId, status: "ACTIVE" },
  });

  const pass = ok === quantityWanted && active === quantityWanted && otherErrors.length === 0;
  console.log(
    `${pass ? "PASS" : "FAIL"} item=${itemId} wanted=${quantityWanted} parallel=${parallel} ` +
      `→ ok=${ok} full=${full} otherErrors=${otherErrors.length} activeInDb=${active}`
  );
  for (const err of otherErrors) {
    console.error("  unexpected error:", (err as PromiseRejectedResult).reason);
  }

  await prisma.reservation.deleteMany({ where: { itemId } });
  return pass;
}

async function main() {
  const parent = await prisma.parent.findFirstOrThrow();
  const list = await prisma.giftList.create({
    data: {
      slug: `test-${Date.now()}`,
      title: "Lista de prueba de concurrencia",
      parentId: parent.id,
      items: {
        create: [
          { name: "Único", quantityWanted: 1 },
          { name: "Triple", quantityWanted: 3 },
        ],
      },
    },
    include: { items: true },
  });

  try {
    const single = list.items.find((i) => i.name === "Único")!;
    const triple = list.items.find((i) => i.name === "Triple")!;

    const results = [
      await testItem(single.id, 1, 10),
      await testItem(triple.id, 3, 10),
    ];

    if (results.every(Boolean)) {
      console.log("Todas las pruebas de concurrencia pasaron ✔");
    } else {
      process.exitCode = 1;
    }
  } finally {
    await prisma.giftList.delete({ where: { id: list.id } });
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

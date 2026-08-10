-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "unitSlot" INTEGER NOT NULL DEFAULT 0,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    CONSTRAINT "Reservation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "GiftItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("cancelledAt", "createdAt", "guestEmail", "guestName", "id", "itemId", "message", "status") SELECT "cancelledAt", "createdAt", "guestEmail", "guestName", "id", "itemId", "message", "status" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE INDEX "Reservation_itemId_idx" ON "Reservation"("itemId");
CREATE INDEX "Reservation_itemId_status_idx" ON "Reservation"("itemId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Partial unique index (hand-written; Prisma's schema DSL cannot express it):
-- at most one ACTIVE reservation per (item, unit slot). Together with the
-- transactional slot assignment in lib/reservations.ts this makes
-- double-booking a constraint violation (P2002) for any quantityWanted.
CREATE UNIQUE INDEX "Reservation_itemId_unitSlot_active_unique"
ON "Reservation"("itemId", "unitSlot")
WHERE "status" = 'ACTIVE';

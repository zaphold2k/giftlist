/*
  Warnings:

  - You are about to drop the column `url` on the `GiftItem` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "GiftItemLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftItemLink_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "GiftItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Backfill: turn each item's single `url` into its first store link.
INSERT INTO "GiftItemLink" ("id", "itemId", "url", "position", "createdAt")
SELECT lower(hex(randomblob(16))), "id", "url", 0, "createdAt"
FROM "GiftItem" WHERE "url" IS NOT NULL AND "url" != '';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GiftItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "quantityWanted" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GiftItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GiftList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GiftItem" ("createdAt", "description", "id", "imageUrl", "listId", "name", "position", "priority", "quantityWanted", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "listId", "name", "position", "priority", "quantityWanted", "updatedAt" FROM "GiftItem";
DROP TABLE "GiftItem";
ALTER TABLE "new_GiftItem" RENAME TO "GiftItem";
CREATE INDEX "GiftItem_listId_idx" ON "GiftItem"("listId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "GiftItemLink_itemId_idx" ON "GiftItemLink"("itemId");

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
    "categoryId" TEXT,
    "quantityWanted" INTEGER NOT NULL DEFAULT 1,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GiftItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GiftList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GiftItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GiftItem" ("categoryId", "createdAt", "description", "id", "imageUrl", "listId", "name", "position", "priority", "quantityWanted", "updatedAt") SELECT "categoryId", "createdAt", "description", "id", "imageUrl", "listId", "name", "position", "priority", "quantityWanted", "updatedAt" FROM "GiftItem";
DROP TABLE "GiftItem";
ALTER TABLE "new_GiftItem" RENAME TO "GiftItem";
CREATE INDEX "GiftItem_listId_idx" ON "GiftItem"("listId");
CREATE INDEX "GiftItem_categoryId_idx" ON "GiftItem"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

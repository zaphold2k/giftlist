-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GiftList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Seed every existing list with the default categories (same set new lists
-- get via DEFAULT_CATEGORIES in lib/categories.ts), so existing items can be
-- remapped onto them below.
INSERT INTO "Category" ("id", "listId", "name", "position", "createdAt")
SELECT lower(hex(randomblob(16))), "id", 'Ropa', 0, CURRENT_TIMESTAMP FROM "GiftList";
INSERT INTO "Category" ("id", "listId", "name", "position", "createdAt")
SELECT lower(hex(randomblob(16))), "id", 'Juguetes', 1, CURRENT_TIMESTAMP FROM "GiftList";
INSERT INTO "Category" ("id", "listId", "name", "position", "createdAt")
SELECT lower(hex(randomblob(16))), "id", 'Higiene y cuidado', 2, CURRENT_TIMESTAMP FROM "GiftList";
INSERT INTO "Category" ("id", "listId", "name", "position", "createdAt")
SELECT lower(hex(randomblob(16))), "id", 'Alimentación', 3, CURRENT_TIMESTAMP FROM "GiftList";
INSERT INTO "Category" ("id", "listId", "name", "position", "createdAt")
SELECT lower(hex(randomblob(16))), "id", 'Paseo', 4, CURRENT_TIMESTAMP FROM "GiftList";
INSERT INTO "Category" ("id", "listId", "name", "position", "createdAt")
SELECT lower(hex(randomblob(16))), "id", 'Habitación', 5, CURRENT_TIMESTAMP FROM "GiftList";
INSERT INTO "Category" ("id", "listId", "name", "position", "createdAt")
SELECT lower(hex(randomblob(16))), "id", 'Otros', 6, CURRENT_TIMESTAMP FROM "GiftList";

-- Capture each item's old enum category before the table rebuild drops it.
CREATE TEMPORARY TABLE "_old_item_categories" AS
SELECT "id" AS "itemId", "listId", "category" FROM "GiftItem" WHERE "category" IS NOT NULL;

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
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GiftItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GiftList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GiftItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GiftItem" ("createdAt", "description", "id", "imageUrl", "listId", "name", "position", "priority", "quantityWanted", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "listId", "name", "position", "priority", "quantityWanted", "updatedAt" FROM "GiftItem";
DROP TABLE "GiftItem";
ALTER TABLE "new_GiftItem" RENAME TO "GiftItem";
CREATE INDEX "GiftItem_listId_idx" ON "GiftItem"("listId");
CREATE INDEX "GiftItem_categoryId_idx" ON "GiftItem"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Category_listId_idx" ON "Category"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_listId_name_key" ON "Category"("listId", "name");

-- Remap each item's old enum category onto its list's matching Category row.
UPDATE "GiftItem"
SET "categoryId" = (
  SELECT c."id" FROM "Category" c, "_old_item_categories" o
  WHERE o."itemId" = "GiftItem"."id"
    AND c."listId" = o."listId"
    AND c."name" = CASE o."category"
      WHEN 'ROPA' THEN 'Ropa'
      WHEN 'JUGUETES' THEN 'Juguetes'
      WHEN 'HIGIENE' THEN 'Higiene y cuidado'
      WHEN 'ALIMENTACION' THEN 'Alimentación'
      WHEN 'PASEO' THEN 'Paseo'
      WHEN 'HABITACION' THEN 'Habitación'
      WHEN 'OTROS' THEN 'Otros'
    END
)
WHERE "id" IN (SELECT "itemId" FROM "_old_item_categories");

DROP TABLE "_old_item_categories";

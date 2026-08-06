-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'sky',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GiftList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("createdAt", "id", "listId", "name", "position") SELECT "createdAt", "id", "listId", "name", "position" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE INDEX "Category_listId_idx" ON "Category"("listId");
CREATE UNIQUE INDEX "Category_listId_name_key" ON "Category"("listId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

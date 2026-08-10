-- CreateTable
CREATE TABLE "GiftListAdmin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftListAdmin_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GiftList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GiftListAdmin_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GiftListAdmin_parentId_idx" ON "GiftListAdmin"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftListAdmin_listId_parentId_key" ON "GiftListAdmin"("listId", "parentId");

-- Backfill: grant each existing list's creator admin rights over it.
INSERT INTO "GiftListAdmin" ("id", "listId", "parentId", "createdAt")
SELECT lower(hex(randomblob(16))), "id", "parentId", "createdAt" FROM "GiftList";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function createParent(overrides: { email?: string; name?: string } = {}) {
  return prisma.parent.create({
    data: {
      email: overrides.email ?? `${randomUUID()}@example.com`,
      // Low cost factor: these tests never exercise password verification,
      // just need a valid bcrypt hash to satisfy the non-null column.
      passwordHash: await bcrypt.hash("test-password", 4),
      name: overrides.name,
    },
  });
}

export async function createList(
  parentId: string,
  overrides: { title?: string; slug?: string } = {}
) {
  return prisma.giftList.create({
    data: {
      slug: overrides.slug ?? randomUUID(),
      title: overrides.title ?? "Lista de prueba",
      parentId,
      admins: { create: { parentId } },
    },
  });
}

export async function createItem(
  listId: string,
  overrides: { name?: string; quantityWanted?: number } = {}
) {
  return prisma.giftItem.create({
    data: {
      listId,
      name: overrides.name ?? "Artículo de prueba",
      quantityWanted: overrides.quantityWanted ?? 1,
    },
  });
}

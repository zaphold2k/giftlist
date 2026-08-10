import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  return session;
}

// Data-level authorization: route protection alone is not enough because
// server actions are reachable via direct POST.
//
// A list can have multiple registered administrators (see GiftListAdmin),
// all with equal rights — access is granted by membership, not by the
// original `GiftList.parentId` creator field.
export async function requireOwnedList(listId: string) {
  const session = await requireSession();
  const list = await prisma.giftList.findUnique({
    where: { id: listId },
    include: { admins: { where: { parentId: session.user.id } } },
  });
  if (!list || list.admins.length === 0) throw new Error("No autorizado");
  return list;
}

export async function requireOwnedItem(itemId: string) {
  const session = await requireSession();
  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    include: { list: { include: { admins: { where: { parentId: session.user.id } } } } },
  });
  if (!item || item.list.admins.length === 0) throw new Error("No autorizado");
  return item;
}

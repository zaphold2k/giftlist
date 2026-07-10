import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  return session;
}

// Data-level authorization: route protection alone is not enough because
// server actions are reachable via direct POST.
export async function requireOwnedList(listId: string) {
  const session = await requireSession();
  const list = await prisma.giftList.findUnique({ where: { id: listId } });
  if (!list || list.parentId !== session.user.id) throw new Error("No autorizado");
  return list;
}

export async function requireOwnedItem(itemId: string) {
  const session = await requireSession();
  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    include: { list: true },
  });
  if (!item || item.list.parentId !== session.user.id) throw new Error("No autorizado");
  return item;
}

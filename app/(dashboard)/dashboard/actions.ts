"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { listSchema, itemSchema } from "@/lib/validation";
import { requireSession, requireOwnedList, requireOwnedItem } from "@/lib/authz";

export type FormState = { error?: string } | undefined;

function parseListForm(formData: FormData) {
  return listSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    eventDate: formData.get("eventDate"),
  });
}

function parseItemForm(formData: FormData) {
  return itemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    url: formData.get("url"),
    imageUrl: formData.get("imageUrl"),
    priority: formData.get("priority") ?? "MEDIUM",
    quantityWanted: formData.get("quantityWanted") ?? 1,
  });
}

export async function createList(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = parseListForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const list = await prisma.giftList.create({
    data: {
      slug: generateSlug(),
      title: parsed.data.title,
      description: parsed.data.description || null,
      eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
      parentId: session.user.id,
    },
  });
  redirect(`/dashboard/lists/${list.id}`);
}

export async function updateList(
  listId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireOwnedList(listId);
  const parsed = parseListForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.giftList.update({
    where: { id: listId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
    },
  });
  revalidatePath(`/dashboard/lists/${listId}`);
  revalidatePath("/dashboard");
  return undefined;
}

export async function deleteList(listId: string): Promise<void> {
  await requireOwnedList(listId);
  await prisma.giftList.delete({ where: { id: listId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function addItem(
  listId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireOwnedList(listId);
  const parsed = parseItemForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const last = await prisma.giftItem.findFirst({
    where: { listId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.giftItem.create({
    data: {
      listId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      url: parsed.data.url || null,
      imageUrl: parsed.data.imageUrl || null,
      priority: parsed.data.priority,
      quantityWanted: parsed.data.quantityWanted,
      position: (last?.position ?? -1) + 1,
    },
  });
  revalidatePath(`/dashboard/lists/${listId}`);
  return undefined;
}

export async function updateItem(
  itemId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const item = await requireOwnedItem(itemId);
  const parsed = parseItemForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.giftItem.update({
    where: { id: itemId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      url: parsed.data.url || null,
      imageUrl: parsed.data.imageUrl || null,
      priority: parsed.data.priority,
      quantityWanted: parsed.data.quantityWanted,
    },
  });
  revalidatePath(`/dashboard/lists/${item.listId}`);
  return undefined;
}

export async function deleteItem(itemId: string): Promise<void> {
  const item = await requireOwnedItem(itemId);
  await prisma.giftItem.delete({ where: { id: itemId } });
  revalidatePath(`/dashboard/lists/${item.listId}`);
}

export async function cancelReservation(reservationId: string): Promise<void> {
  const session = await requireSession();
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { item: { include: { list: true } } },
  });
  if (!reservation || reservation.item.list.parentId !== session.user.id) {
    throw new Error("No autorizado");
  }
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  revalidatePath(`/dashboard/lists/${reservation.item.listId}/reservations`);
  revalidatePath(`/l/${reservation.item.list.slug}`);
}

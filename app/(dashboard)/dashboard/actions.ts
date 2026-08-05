"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import {
  listSchema,
  itemSchema,
  itemLinkSchema,
  addAdminSchema,
  categorySchema,
} from "@/lib/validation";
import { requireSession, requireOwnedList, requireOwnedItem } from "@/lib/authz";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

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
    imageUrl: formData.get("imageUrl"),
    priority: formData.get("priority") ?? "MEDIUM",
    quantityWanted: formData.get("quantityWanted") ?? 1,
  });
}

// The category select only offers the item's own list's categories, but the
// id still needs to be checked server-side (route protection alone isn't
// enough — see requireOwnedList/Item) so a request can't attach an item to
// another list's category.
async function resolveCategoryId(
  listId: string,
  formData: FormData
): Promise<{ ok: true; categoryId: string | null } | { ok: false; error: string }> {
  const raw = formData.get("categoryId");
  if (!raw) return { ok: true, categoryId: null };
  const category = await prisma.category.findFirst({ where: { id: String(raw), listId } });
  if (!category) return { ok: false, error: "Categoría inválida." };
  return { ok: true, categoryId: category.id };
}

// Store links are submitted as parallel `linkLabel[]` / `linkUrl[]` arrays,
// one pair per row the user added in the form. Rows left blank are skipped.
function parseLinksForm(
  formData: FormData
): { success: true; links: { label: string | null; url: string }[] } | { success: false; error: string } {
  const labels = formData.getAll("linkLabel").map(String);
  const urls = formData.getAll("linkUrl").map(String);
  const links: { label: string | null; url: string }[] = [];
  for (let i = 0; i < urls.length; i++) {
    if (!urls[i].trim()) continue;
    const parsed = itemLinkSchema.safeParse({ label: labels[i] ?? "", url: urls[i] });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
    links.push({ label: parsed.data.label || null, url: parsed.data.url });
  }
  return { success: true, links };
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
      admins: { create: { parentId: session.user.id } },
      categories: {
        create: DEFAULT_CATEGORIES.map((name, i) => ({ name, position: i })),
      },
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
  const parsedLinks = parseLinksForm(formData);
  if (!parsedLinks.success) return { error: parsedLinks.error };
  const categoryResult = await resolveCategoryId(listId, formData);
  if (!categoryResult.ok) return { error: categoryResult.error };

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
      imageUrl: parsed.data.imageUrl || null,
      priority: parsed.data.priority,
      categoryId: categoryResult.categoryId,
      quantityWanted: parsed.data.quantityWanted,
      position: (last?.position ?? -1) + 1,
      links: {
        create: parsedLinks.links.map((l, i) => ({ label: l.label, url: l.url, position: i })),
      },
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
  const parsedLinks = parseLinksForm(formData);
  if (!parsedLinks.success) return { error: parsedLinks.error };
  const categoryResult = await resolveCategoryId(item.listId, formData);
  if (!categoryResult.ok) return { error: categoryResult.error };

  await prisma.giftItem.update({
    where: { id: itemId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      priority: parsed.data.priority,
      categoryId: categoryResult.categoryId,
      quantityWanted: parsed.data.quantityWanted,
      links: {
        deleteMany: {},
        create: parsedLinks.links.map((l, i) => ({ label: l.label, url: l.url, position: i })),
      },
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

export async function addCategory(
  listId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireOwnedList(listId);
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.category.findFirst({
    where: { listId, name: parsed.data.name },
  });
  if (existing) return { error: "Ya existe una categoría con ese nombre." };

  const last = await prisma.category.findFirst({
    where: { listId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.category.create({
    data: { listId, name: parsed.data.name, position: (last?.position ?? -1) + 1 },
  });
  revalidatePath(`/dashboard/lists/${listId}`);
  return undefined;
}

export async function renameCategory(
  listId: string,
  categoryId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireOwnedList(listId);
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.category.findFirst({
    where: { listId, name: parsed.data.name, NOT: { id: categoryId } },
  });
  if (existing) return { error: "Ya existe una categoría con ese nombre." };

  await prisma.category.updateMany({
    where: { id: categoryId, listId },
    data: { name: parsed.data.name },
  });
  revalidatePath(`/dashboard/lists/${listId}`);
  return undefined;
}

export async function deleteCategory(listId: string, categoryId: string): Promise<void> {
  await requireOwnedList(listId);
  // Items in this category fall back to uncategorized (categoryId is
  // nullable with onDelete: SetNull) — deleting a category never deletes
  // items.
  await prisma.category.deleteMany({ where: { id: categoryId, listId } });
  revalidatePath(`/dashboard/lists/${listId}`);
}

export async function addListAdmin(
  listId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireOwnedList(listId);
  const parsed = addAdminSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase();
  const parent = await prisma.parent.findUnique({ where: { email } });
  if (!parent) {
    return { error: "No existe ninguna cuenta registrada con ese email." };
  }

  const existing = await prisma.giftListAdmin.findUnique({
    where: { listId_parentId: { listId, parentId: parent.id } },
  });
  if (existing) {
    return { error: "Ya es administrador de esta lista." };
  }

  await prisma.giftListAdmin.create({ data: { listId, parentId: parent.id } });
  revalidatePath(`/dashboard/lists/${listId}`);
  return undefined;
}

export async function removeListAdmin(listId: string, adminId: string): Promise<void> {
  await requireOwnedList(listId);
  const count = await prisma.giftListAdmin.count({ where: { listId } });
  if (count <= 1) throw new Error("No se puede quitar al último administrador de la lista.");

  await prisma.giftListAdmin.deleteMany({ where: { id: adminId, listId } });
  revalidatePath(`/dashboard/lists/${listId}`);
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

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { reserveItem, ReservationFullError } from "@/lib/reservations";
import { isTurnstileConfigured, verifyTurnstile, TurnstileError } from "@/lib/turnstile";
import { reservationSchema } from "@/lib/validation";

export type ReserveState = { error?: string } | undefined;

export async function reserve(
  slug: string,
  itemId: string,
  _prev: ReserveState,
  formData: FormData
): Promise<ReserveState> {
  const parsed = reservationSchema.safeParse({
    guestName: formData.get("guestName"),
    guestEmail: formData.get("guestEmail"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // The item must belong to the list whose (unguessable) slug the guest has —
  // that slug is the only credential guests carry.
  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    select: { list: { select: { slug: true } } },
  });
  if (!item || item.list.slug !== slug) return { error: "El artículo no existe" };

  if (isTurnstileConfigured()) {
    try {
      const remoteIp = (await headers()).get("cf-connecting-ip") ?? undefined;
      await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), remoteIp);
    } catch (error) {
      if (error instanceof TurnstileError) return { error: error.message };
      throw error;
    }
  }

  try {
    await reserveItem({
      itemId,
      guestName: parsed.data.guestName,
      guestEmail: parsed.data.guestEmail || undefined,
      message: parsed.data.message || undefined,
    });
  } catch (error) {
    if (error instanceof ReservationFullError) {
      revalidatePath(`/l/${slug}`);
      return {
        error: "Alguien se te adelantó: este artículo ya está reservado. Actualiza la página para ver el resto.",
      };
    }
    throw error;
  }

  revalidatePath(`/l/${slug}`);
  // Redirect so the confirmation survives the re-render that marks the item
  // as reserved (the form unmounts when the item becomes fully reserved).
  redirect(`/l/${slug}?reservado=${itemId}`);
}

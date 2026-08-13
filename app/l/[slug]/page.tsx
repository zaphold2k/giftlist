/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { categorySwatchClassesOrNeutral } from "@/lib/categories";
import { isTurnstileConfigured } from "@/lib/turnstile";
import { PriorityBadge } from "@/components/priority-badge";
import { CategoryBadge } from "@/components/category-badge";
import { CategoryIndex, categoryAnchorId } from "@/components/category-index";
import { ReservationForm } from "@/components/reservation-form";
import { reserve } from "./actions";

export const dynamic = "force-dynamic";

function linkText(link: { label: string | null; url: string }) {
  if (link.label) return link.label;
  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return "tienda";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = await prisma.giftList.findUnique({
    where: { slug },
    select: { title: true },
  });
  return { title: list ? `${list.title} — giftlist` : "Lista no encontrada" };
}

export default async function PublicListPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reservado?: string }>;
}) {
  const { slug } = await params;
  const { reservado } = await searchParams;
  const list = await prisma.giftList.findUnique({
    where: { slug },
    include: {
      parent: { select: { name: true } },
      items: {
        // No orderBy here: items get regrouped by category and explicitly
        // re-sorted below, so any DB-level order would be immediately
        // discarded — don't add one back without removing that grouping.
        where: { hidden: false },
        include: {
          links: { orderBy: { position: "asc" } },
          category: { select: { id: true, name: true, color: true, position: true } },
          reservations: { where: { status: "ACTIVE" }, select: { id: true } },
        },
      },
    },
  });
  if (!list) notFound();

  // Same gate the server uses to require a token (isTurnstileConfigured()
  // checks TURNSTILE_SECRET_KEY) — showing the widget without the server
  // enforcing it, or vice versa, would be pointless.
  const turnstileSiteKey = isTurnstileConfigured()
    ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    : undefined;

  const items = list.items;

  // Group by category (position order; uncategorized last), items within a
  // group ascending by how many units are wanted — the point is guests see
  // the "just one, easy to fully cover" gifts before big-ticket asks.
  // Deliberate: priority no longer drives order here (it did before this
  // grouping existed) — PriorityBadge is still shown, it just isn't a sort
  // key anymore.
  type Item = (typeof items)[number];
  type Group = { id: string | null; name: string; color: string | null; position: number; items: Item[] };
  const groupsByKey = new Map<string, Group>();
  for (const item of items) {
    const key = item.category?.id ?? "__none__";
    let group = groupsByKey.get(key);
    if (!group) {
      group = {
        id: item.category?.id ?? null,
        name: item.category?.name ?? "Sin categoría",
        color: item.category?.color ?? null,
        position: item.category?.position ?? Number.MAX_SAFE_INTEGER,
        items: [],
      };
      groupsByKey.set(key, group);
    }
    group.items.push(item);
  }
  const groups = [...groupsByKey.values()].sort((a, b) => a.position - b.position);
  for (const group of groups) {
    group.items.sort((a, b) => a.quantityWanted - b.quantityWanted || a.position - b.position);
  }

  return (
    <div className="min-h-screen bg-rose-50/40">
      <header className="border-b border-rose-100 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-sm font-medium text-rose-500">🍼 Lista de regalos</p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900">{list.title}</h1>
          {list.description && (
            <p className="mt-2 text-zinc-600">{list.description}</p>
          )}
          {list.eventDate && (
            <p className="mt-2 text-sm text-zinc-500">
              🗓️{" "}
              {list.eventDate.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          <p className="mt-3 text-xs text-zinc-400">
            Elige un regalo y resérvalo para que nadie lo repita. No necesitas cuenta.
          </p>
        </div>
      </header>

      <CategoryIndex groups={groups} />

      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        {reservado && items.some((i) => i.id === reservado) && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
            ¡Reservado! Gracias por tu regalo 💝 «
            {items.find((i) => i.id === reservado)!.name}» queda a tu nombre.
          </p>
        )}
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-rose-200 bg-white p-8 text-center text-sm text-zinc-500">
            Esta lista todavía no tiene artículos.
          </p>
        )}
        {groups.map((group) => (
          <section
            key={group.id ?? "sin-categoria"}
            id={categoryAnchorId(group.id)}
            className="scroll-mt-6 space-y-4"
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${categorySwatchClassesOrNeutral(group.color)}`}
              />
              {group.name}
            </h2>
            {group.items.map((item) => {
              const reserved = item.reservations.length;
              const remaining = item.quantityWanted - reserved;
              const fullyReserved = remaining <= 0;

              return (
                <article
                  key={item.id}
                  className={`rounded-xl border bg-white p-5 shadow-sm ${
                    fullyReserved ? "border-zinc-200 opacity-70" : "border-zinc-200"
                  }`}
                >
                  <div className="flex gap-4">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-lg border border-zinc-100 object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                        <PriorityBadge priority={item.priority} />
                        <CategoryBadge category={item.category} />
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
                      )}
                      {item.links.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {item.links.map((link) => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                            >
                              {linkText(link)} ↗
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                        {item.quantityWanted > 1 && (
                          <span className="text-zinc-500">
                            {reserved} de {item.quantityWanted} reservados
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    {fullyReserved ? (
                      <p className="rounded-lg bg-zinc-100 px-3 py-2 text-center text-sm font-medium text-zinc-500">
                        Ya reservado 🎁
                      </p>
                    ) : (
                      <ReservationForm
                        action={reserve.bind(null, list.slug, item.id)}
                        remaining={remaining}
                        turnstileSiteKey={turnstileSiteKey}
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ))}
      </main>

      <footer className="pb-8 text-center text-xs text-zinc-400">
        Hecho con giftlist
      </footer>
    </div>
  );
}

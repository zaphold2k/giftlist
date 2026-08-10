import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cancelReservation } from "../../../actions";

export const metadata = { title: "Reservas — giftlist" };

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();
  const list = await prisma.giftList.findUnique({
    where: { id: listId },
    include: {
      admins: { where: { parentId: session.user.id } },
      items: {
        orderBy: { position: "asc" },
        include: {
          reservations: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!list || list.admins.length === 0) notFound();

  const itemsWithReservations = list.items.filter((i) => i.reservations.length > 0);

  return (
    <div>
      <Link
        href={`/dashboard/lists/${list.id}`}
        className="text-sm text-zinc-500 hover:text-rose-600"
      >
        ← {list.title}
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold text-zinc-900">Reservas</h1>

      {itemsWithReservations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rose-200 bg-white p-12 text-center">
          <p className="text-lg font-medium text-zinc-700">Todavía no hay reservas</p>
          <p className="mt-1 text-sm text-zinc-500">
            Comparte el enlace de la lista para que familia y amigos reserven regalos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {itemsWithReservations.map((item) => (
            <section
              key={item.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-3 font-semibold text-zinc-900">
                {item.name}{" "}
                <span className="text-sm font-normal text-zinc-500">
                  ({item.reservations.length} de {item.quantityWanted})
                </span>
              </h2>
              <ul className="divide-y divide-zinc-100">
                {item.reservations.map((reservation) => (
                  <li
                    key={reservation.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-800">{reservation.guestName}</p>
                      {reservation.guestEmail && (
                        <p className="text-sm text-zinc-500">{reservation.guestEmail}</p>
                      )}
                      {reservation.message && (
                        <p className="mt-1 text-sm italic text-zinc-600">
                          “{reservation.message}”
                        </p>
                      )}
                      <p className="mt-1 text-xs text-zinc-400">
                        {reservation.createdAt.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <form action={cancelReservation.bind(null, reservation.id)}>
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
                      >
                        Liberar
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

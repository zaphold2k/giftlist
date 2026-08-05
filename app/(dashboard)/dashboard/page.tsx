import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Mis listas — giftlist" };

export default async function DashboardPage() {
  const session = await auth();
  const lists = await prisma.giftList.findMany({
    where: { admins: { some: { parentId: session!.user.id } } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: {
        select: {
          reservations: { where: { status: "ACTIVE" }, select: { id: true } },
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Mis listas</h1>
        <Link
          href="/dashboard/lists/new"
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
        >
          + Nueva lista
        </Link>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rose-200 bg-white p-12 text-center">
          <p className="mb-2 text-lg font-medium text-zinc-700">
            Todavía no tienes ninguna lista
          </p>
          <p className="text-sm text-zinc-500">
            Crea tu primera lista de regalos y compártela con familia y amigos.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {lists.map((list) => {
            const reserved = list.items.reduce(
              (acc, item) => acc + item.reservations.length,
              0
            );
            return (
              <li key={list.id}>
                <Link
                  href={`/dashboard/lists/${list.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-rose-300 hover:shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-zinc-900">{list.title}</h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        {list._count.items}{" "}
                        {list._count.items === 1 ? "artículo" : "artículos"} ·{" "}
                        {reserved} {reserved === 1 ? "reserva" : "reservas"}
                      </p>
                    </div>
                    <span className="text-sm text-rose-500">Gestionar →</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

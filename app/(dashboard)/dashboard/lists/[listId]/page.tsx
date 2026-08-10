import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ListForm } from "@/components/list-form";
import { ItemForm } from "@/components/item-form";
import { ItemRow } from "@/components/item-row";
import { CopyLink } from "@/components/copy-link";
import { DeleteListButton } from "@/components/delete-list-button";
import { ListAdmins } from "@/components/list-admins";
import { ListCategories } from "@/components/list-categories";
import {
  updateList,
  deleteList,
  addItem,
  updateItem,
  deleteItem,
  addListAdmin,
  removeListAdmin,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../../actions";

export const metadata = { title: "Editar lista — giftlist" };

export default async function EditListPage({
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
      admins: { include: { parent: { select: { id: true, name: true, email: true } } } },
      categories: { orderBy: { position: "asc" } },
      items: {
        orderBy: { position: "asc" },
        include: {
          links: { orderBy: { position: "asc" } },
          category: { select: { id: true, name: true, color: true } },
          reservations: { where: { status: "ACTIVE" }, select: { id: true } },
        },
      },
    },
  });
  if (!list || !list.admins.some((a) => a.parentId === session.user.id)) notFound();

  const totalReservations = list.items.reduce(
    (acc, item) => acc + item.reservations.length,
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-rose-600">
            ← Mis listas
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">{list.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyLink path={`/l/${list.slug}`} />
          <Link
            href={`/l/${list.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Ver como invitado ↗
          </Link>
          <Link
            href={`/dashboard/lists/${list.id}/reservations`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Reservas ({totalReservations})
          </Link>
          <DeleteListButton title={list.title} action={deleteList.bind(null, list.id)} />
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Datos de la lista</h2>
        <ListForm
          action={updateList.bind(null, list.id)}
          defaults={{
            title: list.title,
            description: list.description,
            eventDate: list.eventDate?.toISOString().slice(0, 10),
          }}
          submitLabel="Guardar cambios"
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Administradores ({list.admins.length})
        </h2>
        <ListAdmins
          admins={list.admins.map((a) => ({
            id: a.id,
            name: a.parent.name,
            email: a.parent.email,
            isSelf: a.parentId === session.user.id,
          }))}
          addAction={addListAdmin.bind(null, list.id)}
          removeAction={removeListAdmin.bind(null, list.id)}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Categorías ({list.categories.length})
        </h2>
        <ListCategories
          categories={list.categories}
          addAction={addCategory.bind(null, list.id)}
          updateAction={updateCategory.bind(null, list.id)}
          deleteAction={deleteCategory.bind(null, list.id)}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Artículos ({list.items.length})
        </h2>
        {list.items.length === 0 ? (
          <p className="mb-4 rounded-xl border border-dashed border-rose-200 bg-white p-6 text-center text-sm text-zinc-500">
            Añade el primer artículo con el formulario de abajo.
          </p>
        ) : (
          <ul className="mb-6 space-y-3">
            {list.items.map((item) => (
              <ItemRow
                key={item.id}
                item={{
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  links: item.links.map((l) => ({ label: l.label ?? "", url: l.url })),
                  imageUrl: item.imageUrl,
                  priority: item.priority,
                  category: item.category,
                  quantityWanted: item.quantityWanted,
                  activeReservations: item.reservations.length,
                }}
                categories={list.categories}
                updateAction={updateItem.bind(null, item.id)}
                deleteAction={deleteItem.bind(null, item.id)}
              />
            ))}
          </ul>
        )}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-zinc-900">Añadir artículo</h3>
          <ItemForm
            action={addItem.bind(null, list.id)}
            categories={list.categories}
            submitLabel="Añadir"
            resetOnSuccess
          />
        </div>
      </section>
    </div>
  );
}

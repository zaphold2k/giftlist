"use client";

import { useState } from "react";
import { ItemForm } from "@/components/item-form";
import { PriorityBadge } from "@/components/priority-badge";
import { CategoryBadge } from "@/components/category-badge";
import type { FormState } from "@/app/(dashboard)/dashboard/actions";

export function ItemRow({
  item,
  categories,
  updateAction,
  deleteAction,
}: {
  item: {
    id: string;
    name: string;
    description: string | null;
    links: { label: string; url: string }[];
    imageUrl: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH";
    category: { id: string; name: string } | null;
    quantityWanted: number;
    activeReservations: number;
  };
  categories: { id: string; name: string }[];
  updateAction: (state: FormState, formData: FormData) => Promise<FormState>;
  deleteAction: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
        <ItemForm
          action={updateAction}
          defaults={{ ...item, categoryId: item.category?.id ?? null }}
          categories={categories}
          submitLabel="Guardar cambios"
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900">{item.name}</span>
          <PriorityBadge priority={item.priority} />
          <CategoryBadge category={item.category} />
          {item.quantityWanted > 1 && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              ×{item.quantityWanted}
            </span>
          )}
        </div>
        {item.description && (
          <p className="mt-1 truncate text-sm text-zinc-500">{item.description}</p>
        )}
        <p className="mt-1 text-xs text-zinc-500">
          {item.activeReservations > 0
            ? `${item.activeReservations} de ${item.quantityWanted} reservado${item.activeReservations === 1 ? "" : "s"}`
            : "Sin reservas"}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
        >
          Editar
        </button>
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!confirm(`¿Eliminar "${item.name}"?`)) e.preventDefault();
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
          >
            Eliminar
          </button>
        </form>
      </div>
    </li>
  );
}

"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/(dashboard)/dashboard/actions";

type Category = { id: string; name: string };

function CategoryRow({
  category,
  renameAction,
  removeAction,
}: {
  category: Category;
  renameAction: (state: FormState, formData: FormData) => Promise<FormState>;
  removeAction: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await renameAction(prev, formData);
      if (!result?.error) setEditing(false);
      return result;
    },
    undefined
  );

  if (editing) {
    return (
      <li className="py-2">
        <form action={formAction} className="flex items-center gap-2">
          <input
            name="name"
            type="text"
            required
            defaultValue={category.name}
            autoFocus
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancelar
          </button>
        </form>
        {state?.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-zinc-900">{category.name}</span>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
        >
          Renombrar
        </button>
        <form
          action={removeAction}
          onSubmit={(e) => {
            if (
              !confirm(
                `¿Eliminar la categoría "${category.name}"? Los artículos que la tengan quedarán sin categoría.`
              )
            )
              e.preventDefault();
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

export function ListCategories({
  categories,
  addAction,
  renameAction,
  deleteAction,
}: {
  categories: Category[];
  addAction: (state: FormState, formData: FormData) => Promise<FormState>;
  renameAction: (categoryId: string, state: FormState, formData: FormData) => Promise<FormState>;
  deleteAction: (categoryId: string) => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(addAction, undefined);

  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <ul className="divide-y divide-zinc-100">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              renameAction={renameAction.bind(null, category.id)}
              removeAction={deleteAction.bind(null, category.id)}
            />
          ))}
        </ul>
      )}

      <form action={formAction} className="flex items-start gap-2">
        <div className="flex-1">
          <input
            name="name"
            type="text"
            required
            placeholder="Nueva categoría"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          {state?.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50"
        >
          {pending ? "Agregando…" : "Agregar"}
        </button>
      </form>
    </div>
  );
}

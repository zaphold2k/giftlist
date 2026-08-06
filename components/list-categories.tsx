"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/(dashboard)/dashboard/actions";
import {
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_COLOR,
  categorySwatchClasses,
  type CategoryColor,
} from "@/lib/categories";

type Category = { id: string; name: string; color: string };

function ColorSwatches({
  value,
  onChange,
}: {
  value: CategoryColor;
  onChange: (color: CategoryColor) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={color}
          aria-pressed={value === color}
          className={`h-6 w-6 shrink-0 rounded-full ${categorySwatchClasses(color)} ${
            value === color ? "ring-2 ring-zinc-400 ring-offset-2" : ""
          }`}
        />
      ))}
      <input type="hidden" name="color" value={value} />
    </div>
  );
}

function asCategoryColor(color: string): CategoryColor {
  return (CATEGORY_COLORS as readonly string[]).includes(color)
    ? (color as CategoryColor)
    : DEFAULT_CATEGORY_COLOR;
}

function CategoryRow({
  category,
  updateAction,
  removeAction,
}: {
  category: Category;
  updateAction: (state: FormState, formData: FormData) => Promise<FormState>;
  removeAction: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [color, setColor] = useState<CategoryColor>(() => asCategoryColor(category.color));
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await updateAction(prev, formData);
      if (!result?.error) setEditing(false);
      return result;
    },
    undefined
  );

  if (editing) {
    return (
      <li className="space-y-2 py-2">
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
        <ColorSwatches value={color} onChange={setColor} />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 py-2">
      <span className="flex items-center gap-2 text-sm font-medium text-zinc-900">
        <span className={`h-3 w-3 shrink-0 rounded-full ${categorySwatchClasses(category.color)}`} />
        {category.name}
      </span>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
        >
          Editar
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
  updateAction,
  deleteAction,
}: {
  categories: Category[];
  addAction: (state: FormState, formData: FormData) => Promise<FormState>;
  updateAction: (categoryId: string, state: FormState, formData: FormData) => Promise<FormState>;
  deleteAction: (categoryId: string) => Promise<void>;
}) {
  const [newColor, setNewColor] = useState<CategoryColor>(DEFAULT_CATEGORY_COLOR);
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await addAction(prev, formData);
      if (!result?.error) setNewColor(DEFAULT_CATEGORY_COLOR);
      return result;
    },
    undefined
  );

  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <ul className="divide-y divide-zinc-100">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              updateAction={updateAction.bind(null, category.id)}
              removeAction={deleteAction.bind(null, category.id)}
            />
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-2">
        <div className="flex items-start gap-2">
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
        </div>
        <ColorSwatches value={newColor} onChange={setNewColor} />
      </form>
    </div>
  );
}

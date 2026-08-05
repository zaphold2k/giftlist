"use client";

import { useActionState, useRef, useState } from "react";
import type { FormState } from "@/app/(dashboard)/dashboard/actions";
import { CATEGORIES, CATEGORY_LABELS, type ItemCategory } from "@/lib/categories";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200";

type Link = { label: string; url: string };
let linkKeySeq = 0;
function nextLinkKey() {
  return linkKeySeq++;
}

export function ItemForm({
  action,
  defaults,
  submitLabel,
  onDone,
  resetOnSuccess,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults?: {
    name?: string;
    description?: string | null;
    links?: Link[];
    imageUrl?: string | null;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    category?: ItemCategory | null;
    quantityWanted?: number;
  };
  submitLabel: string;
  onDone?: () => void;
  resetOnSuccess?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [links, setLinks] = useState<{ key: number; label: string; url: string }[]>(() => {
    const initial = defaults?.links?.length ? defaults.links : [{ label: "", url: "" }];
    return initial.map((l) => ({ key: nextLinkKey(), ...l }));
  });
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result?.error) {
        if (resetOnSuccess) {
          formRef.current?.reset();
          setLinks([{ key: nextLinkKey(), label: "", url: "" }]);
        }
        onDone?.();
      }
      return result;
    },
    undefined
  );
  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-700">Nombre</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={defaults?.name}
            placeholder="Ej: Carrito de paseo"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Descripción <span className="text-zinc-400">(opcional)</span>
          </label>
          <input
            name="description"
            type="text"
            defaultValue={defaults?.description ?? ""}
            placeholder="Color, talla, detalles…"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Enlaces a tienda <span className="text-zinc-400">(opcional)</span>
          </label>
          <p className="mb-2 text-xs text-zinc-400">
            Agregá más de uno para dar opciones (distintas tiendas, colores, talles…).
          </p>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={link.key} className="flex gap-2">
                <input
                  name="linkLabel"
                  type="text"
                  value={link.label}
                  onChange={(e) => {
                    const next = [...links];
                    next[i] = { ...next[i], label: e.target.value };
                    setLinks(next);
                  }}
                  placeholder="Tienda (opcional)"
                  className={`${inputClass} sm:w-40`}
                />
                <input
                  name="linkUrl"
                  type="url"
                  value={link.url}
                  onChange={(e) => {
                    const next = [...links];
                    next[i] = { ...next[i], url: e.target.value };
                    setLinks(next);
                  }}
                  placeholder="https://…"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setLinks(links.filter((_, j) => j !== i))}
                  className="shrink-0 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-500 transition hover:bg-zinc-50"
                  aria-label="Quitar enlace"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLinks([...links, { key: nextLinkKey(), label: "", url: "" }])}
            className="mt-2 text-sm font-medium text-rose-600 hover:underline"
          >
            + Agregar otro enlace
          </button>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Imagen (URL) <span className="text-zinc-400">(opcional)</span>
          </label>
          <input
            name="imageUrl"
            type="url"
            defaultValue={defaults?.imageUrl ?? ""}
            placeholder="https://…"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Prioridad</label>
          <select
            name="priority"
            defaultValue={defaults?.priority ?? "MEDIUM"}
            className={inputClass}
          >
            <option value="HIGH">Alta — nos hace mucha falta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baja — sería un detalle</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Categoría <span className="text-zinc-400">(opcional)</span>
          </label>
          <select
            name="category"
            defaultValue={defaults?.category ?? ""}
            className={inputClass}
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Cantidad</label>
          <input
            name="quantityWanted"
            type="number"
            min={1}
            max={99}
            defaultValue={defaults?.quantityWanted ?? 1}
            className={inputClass}
          />
        </div>
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50"
        >
          {pending ? "Guardando…" : submitLabel}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

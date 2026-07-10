"use client";

import { useActionState, useRef } from "react";
import type { FormState } from "@/app/(dashboard)/dashboard/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200";

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
    url?: string | null;
    imageUrl?: string | null;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    quantityWanted?: number;
  };
  submitLabel: string;
  onDone?: () => void;
  resetOnSuccess?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result?.error) {
        if (resetOnSuccess) formRef.current?.reset();
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
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Enlace a tienda <span className="text-zinc-400">(opcional)</span>
          </label>
          <input
            name="url"
            type="url"
            defaultValue={defaults?.url ?? ""}
            placeholder="https://…"
            className={inputClass}
          />
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

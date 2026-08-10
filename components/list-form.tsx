"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(dashboard)/dashboard/actions";

export function ListForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults?: { title?: string; description?: string | null; eventDate?: string };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-700">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaults?.title}
          placeholder="Lista para la llegada de…"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-zinc-700"
        >
          Descripción <span className="text-zinc-400">(opcional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaults?.description ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
      </div>
      <div>
        <label htmlFor="eventDate" className="mb-1 block text-sm font-medium text-zinc-700">
          Fecha del evento <span className="text-zinc-400">(opcional)</span>
        </label>
        <input
          id="eventDate"
          name="eventDate"
          type="date"
          defaultValue={defaults?.eventDate}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50"
      >
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}

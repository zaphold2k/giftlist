"use client";

import { useActionState, useState } from "react";
import type { ReserveState } from "@/app/l/[slug]/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200";

export function ReservationForm({
  action,
  remaining,
}: {
  action: (state: ReserveState, formData: FormData) => Promise<ReserveState>;
  remaining: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, undefined);

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
        >
          Reservar este regalo
        </button>
        {state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg bg-rose-50/60 p-3">
      {remaining > 1 && (
        <p className="text-xs text-zinc-500">
          Quedan {remaining} unidades por reservar; tu reserva es de 1 unidad.
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Tu nombre</label>
        <input name="guestName" type="text" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Tu email <span className="text-zinc-400">(opcional)</span>
        </label>
        <input name="guestEmail" type="email" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Mensaje para los papás <span className="text-zinc-400">(opcional)</span>
        </label>
        <input name="message" type="text" className={inputClass} />
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
          {pending ? "Reservando…" : "Confirmar reserva"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

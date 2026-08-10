"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(dashboard)/dashboard/actions";

type Admin = {
  id: string;
  name: string | null;
  email: string;
  isSelf: boolean;
};

export function ListAdmins({
  admins,
  addAction,
  removeAction,
}: {
  admins: Admin[];
  addAction: (state: FormState, formData: FormData) => Promise<FormState>;
  removeAction: (adminId: string) => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(addAction, undefined);

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-zinc-100">
        {admins.map((admin) => (
          <li key={admin.id} className="flex items-center justify-between gap-4 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900">
                {admin.name || admin.email} {admin.isSelf && <span className="text-zinc-400">(vos)</span>}
              </p>
              {admin.name && <p className="text-xs text-zinc-500">{admin.email}</p>}
            </div>
            <form
              action={removeAction.bind(null, admin.id)}
              onSubmit={(e) => {
                const msg = admin.isSelf
                  ? "¿Dejar de ser administrador de esta lista? Perderás acceso a ella."
                  : `¿Quitar a ${admin.name || admin.email} como administrador?`;
                if (!confirm(msg)) e.preventDefault();
              }}
            >
              <button
                type="submit"
                disabled={admins.length <= 1}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                title={admins.length <= 1 ? "No podés quitar al último administrador" : undefined}
              >
                Quitar
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form action={formAction} className="flex items-start gap-2">
        <div className="flex-1">
          <input
            name="email"
            type="email"
            required
            placeholder="email@ejemplo.com"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          {state?.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
          <p className="mt-1 text-xs text-zinc-400">
            Debe ser el email de una cuenta ya registrada en giftlist.
          </p>
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

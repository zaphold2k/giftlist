"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/app/(auth)/actions";

type Field = {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
};

export function AuthForm({
  title,
  action,
  fields,
  submitLabel,
  footer,
  hiddenFields,
}: {
  title: string;
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
  footer: { text: string; linkLabel: string; href: string };
  hiddenFields?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-bold text-zinc-900">{title}</h1>
      <form action={formAction} className="space-y-4">
        {hiddenFields &&
          Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
        ))}
        {state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50"
        >
          {pending ? "Un momento…" : submitLabel}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600">
        {footer.text}{" "}
        <Link href={footer.href} className="font-medium text-rose-600 hover:underline">
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
}

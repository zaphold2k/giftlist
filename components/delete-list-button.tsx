"use client";

export function DeleteListButton({
  title,
  action,
}: {
  title: string;
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `¿Eliminar la lista "${title}"? Se borrarán también sus artículos y reservas.`
          )
        )
          e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
      >
        Eliminar lista
      </button>
    </form>
  );
}

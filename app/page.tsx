import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-rose-50/40">
      <header className="border-b border-rose-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold text-rose-600">🍼 giftlist</span>
          <nav className="flex items-center gap-3">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
              >
                Mis listas
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition hover:text-rose-600"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            La lista de regalos para la llegada de tu bebé
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">
            Publica los artículos que necesitáis, comparte el enlace con familia y
            amigos, y deja que cada uno reserve su regalo. Sin duplicados y sin que
            los invitados necesiten cuenta.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href={session?.user ? "/dashboard" : "/register"}
              className="rounded-lg bg-rose-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-600"
            >
              Crear mi lista
            </Link>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl gap-6 text-left sm:grid-cols-3">
            {[
              {
                emoji: "📝",
                title: "Crea tu lista",
                text: "Añade los artículos que necesitáis, con enlaces, prioridades y cantidades.",
              },
              {
                emoji: "🔗",
                title: "Comparte el enlace",
                text: "Un enlace privado que solo tienen las personas a las que se lo envías.",
              },
              {
                emoji: "🎁",
                title: "Reservas sin cuenta",
                text: "Cada invitado reserva su regalo con su nombre. Nadie repite regalo.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <span className="text-2xl">{feature.emoji}</span>
                <h2 className="mt-2 font-semibold text-zinc-900">{feature.title}</h2>
                <p className="mt-1 text-sm text-zinc-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

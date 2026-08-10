import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-rose-50/40">
      <header className="p-6">
        <Link href="/" className="text-lg font-bold text-rose-600">
          🍼 giftlist
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-24">
        {children}
      </main>
    </div>
  );
}

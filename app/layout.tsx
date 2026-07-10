import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "giftlist — lista de regalos para tu bebé",
  description:
    "Crea una lista de regalos para tu bebé y compártela con familia y amigos para evitar regalos duplicados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

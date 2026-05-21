import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PGS Eventi Live",
  description: "Piattaforma live per eventi, calendari, classifiche, media e streaming PGS Emilia-Romagna."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}

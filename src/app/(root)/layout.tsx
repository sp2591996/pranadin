import type { Metadata } from "next";
import { fontClassName } from "../fonts";
import "../globals.css";

export const metadata: Metadata = { title: "PranaDin", robots: { index: false, follow: false }, icons: { icon: "/favicon.svg" } };

/** Root layout for `/` only (language redirect). Localized pages use app/[locale]/layout.tsx. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontClassName}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

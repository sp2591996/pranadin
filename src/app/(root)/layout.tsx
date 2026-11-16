import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = { title: "PranaDin", robots: { index: false, follow: false } };

/** Root layout for `/` only (language redirect). Localized pages use app/[locale]/layout.tsx. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Page not found · PranaDin" };

/** 404 for any unmatched URL (static export writes it as 404.html). English only: no locale is known here. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-[var(--gutter)]">
          <h1>Page not found</h1>
          {/* Plain <a>: this page renders outside the app router. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="text-primary underline underline-offset-2">
            Go to PranaDin
          </a>
        </main>
      </body>
    </html>
  );
}

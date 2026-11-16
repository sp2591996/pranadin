/**
 * Eczar + Mukta (DS-2, 13_Design/font-plan.md). `next/font/google` fetches the
 * files at build time and serves them from our own origin, so the browser
 * never calls Google (font-src 'self', no third-party request).
 * Both fonts are SIL OFL 1.1.
 */
import { Eczar, Mukta } from "next/font/google";

export const mukta = Mukta({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mukta",
  fallback: ["Noto Sans Devanagari", "system-ui", "sans-serif"],
  adjustFontFallback: true,
});

export const eczar = Eczar({
  weight: "600",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-eczar",
  fallback: ["Noto Serif Devanagari", "Georgia", "serif"],
  adjustFontFallback: true,
});

export const fontClassName = `${mukta.variable} ${eczar.variable}`;

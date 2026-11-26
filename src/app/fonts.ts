/**
 * D-033 look (after the reference prototype). `next/font/google` fetches the
 * files at build time and serves them from our own origin, so the browser
 * never calls Google (font-src 'self', no third-party request).
 * Cormorant Garamond (Latin headings), Noto Serif Devanagari (Devanagari
 * headings), Outfit (Latin body), Hind (Devanagari body). All SIL OFL 1.1.
 */
import { Cormorant_Garamond, Hind, Noto_Serif_Devanagari, Outfit } from "next/font/google";

const cormorant = Cormorant_Garamond({ display: "swap", weight: ["500", "600", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-cormorant", fallback: ["Georgia", "serif"], adjustFontFallback: true });
const serifDeva = Noto_Serif_Devanagari({ display: "swap", preload: false, weight: ["500", "600"], subsets: ["devanagari"], variable: "--font-serif-deva" });
const outfit = Outfit({ display: "swap", weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-outfit", fallback: ["system-ui", "sans-serif"], adjustFontFallback: true });
const hind = Hind({ display: "swap", preload: false, weight: ["400", "500", "600"], subsets: ["devanagari", "latin"], variable: "--font-hind" });

export const fontClassName = [cormorant, serifDeva, outfit, hind].map((f) => f.variable).join(" ");

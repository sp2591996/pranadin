/**
 * Direction C "Rich Festive Mandala" (D-029). `next/font/google` fetches the
 * files at build time and serves them from our own origin, so the browser
 * never calls Google (font-src 'self', no third-party request).
 * Rozha One (headings), Yatra One (Devanagari display), Poppins (Latin body),
 * Hind (Devanagari body). All SIL OFL 1.1.
 */
import { Hind, Poppins, Rozha_One, Yatra_One } from "next/font/google";

const rozha = Rozha_One({ display: "swap", weight: "400", subsets: ["latin"], variable: "--font-rozha", fallback: ["Georgia", "serif"], adjustFontFallback: true });
const yatra = Yatra_One({ display: "swap", preload: false, weight: "400", subsets: ["devanagari", "latin"], variable: "--font-yatra" });
const poppins = Poppins({ display: "swap", weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-poppins", fallback: ["system-ui", "sans-serif"], adjustFontFallback: true });
const hind = Hind({ display: "swap", preload: false, weight: ["400", "500", "600"], subsets: ["devanagari", "latin"], variable: "--font-hind" });

export const fontClassName = [rozha, yatra, poppins, hind].map((f) => f.variable).join(" ");

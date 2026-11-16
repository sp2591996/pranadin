/**
 * Dev-2 deep links, as planned in `src/lib/routes.ts` (CR-D2-01 asks Dev-1 to
 * move them into `routes`). Optional query: `?min=5&src=plan` (minutes, and
 * whether the session started from Today's plan). No personal data in URLs.
 */
import type { Locale } from "@/lib/types";

export const SILENT_ID = "silent";

export const practiceRoutes = {
  breath: (l: Locale, slug: string) => `/${l}/practice/breath/${slug}/`,
  stillness: (l: Locale, slug: string) => `/${l}/practice/stillness/${slug}/`,
  journalNew: (l: Locale) => `/${l}/journal/?new=1`,
};

/** Read `?min=` and `?src=` on the client. */
export function readSessionQuery(allowed: readonly number[], fallback: number): { minutes: number; source: "plan" | "free" } {
  try {
    const q = new URLSearchParams(window.location.search);
    const m = Number(q.get("min"));
    return { minutes: allowed.includes(m) ? m : fallback, source: q.get("src") === "plan" ? "plan" : "free" };
  } catch {
    return { minutes: fallback, source: "free" };
  }
}

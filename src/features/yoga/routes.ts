/** Yoga deep links. Programme sessions carry `?prog=<id>&day=<n>`; no personal data in URLs. */
import type { Locale } from "@/lib/types";

export const yogaRoutes = {
  home: (l: Locale) => `/${l}/practice/yoga/`,
  pose: (l: Locale, slug: string) => `/${l}/practice/yoga/pose/${slug}/`,
  session: (l: Locale, slug: string, prog?: { id: string; day: number }) =>
    `/${l}/practice/yoga/session/${slug}/${prog ? `?prog=${programSlug(prog.id)}&day=${prog.day}` : ""}`,
  program: (l: Locale, id: string) => `/${l}/practice/yoga/program/${programSlug(id)}/`,
};

/** Programme ids look like `prog.beginner-7`; URLs use the part after the dot. */
export function programSlug(id: string): string {
  return id.replace(/^prog\./, "");
}
export function programId(slug: string): string {
  return `prog.${slug}`;
}

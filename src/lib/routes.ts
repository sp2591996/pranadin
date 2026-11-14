/**
 * Route map (E-02 contract). Build every in-app link with these helpers so
 * paths stay consistent across locales. All routes are prerendered for
 * en / hi / mr by the static export; there are no server routes.
 */
import type { Locale } from "./types";

export const TABS = ["today", "practice", "calendar", "journal"] as const;
export type Tab = (typeof TABS)[number];

/** Trust and legal pages (C9, L1). Content lives in `app/content/trust/<slug>.json`. */
export const TRUST_PAGES = [
  "about",
  "privacy",
  "terms",
  "disclaimer",
  "safety",
  "sources",
  "ai-use",
  "corrections",
] as const;
export type TrustPage = (typeof TRUST_PAGES)[number];

export const routes = {
  /** Language picker / redirect. Sends the user to their stored or browser locale. */
  root: () => "/",
  today: (l: Locale) => `/${l}/today/`,
  practice: (l: Locale) => `/${l}/practice/`,
  calendar: (l: Locale) => `/${l}/calendar/`,
  journal: (l: Locale) => `/${l}/journal/`,
  onboarding: (l: Locale) => `/${l}/onboarding/`,
  /** "Me" screen: language, city, theme, reminders, privacy & data, help. */
  settings: (l: Locale) => `/${l}/settings/`,
  trust: (l: Locale, page: TrustPage) => `/${l}/info/${page}/`,
} as const;

export function tabHref(locale: Locale, tab: Tab): string {
  return routes[tab](locale);
}

/**
 * Swap the locale prefix of an in-app path, keeping the rest. Used by the
 * language switcher. Paths outside the locale tree go to Today.
 */
export function withLocale(path: string, locale: Locale): string {
  const m = /^\/(en|hi|mr)(\/.*)?$/.exec(path);
  if (!m) return routes.today(locale);
  return `/${locale}${m[2] ?? "/"}`;
}

/**
 * Planned deep links for Dev-2 (nested under the tabs, max depth 2):
 *   /{l}/practice/breath/{techniqueId}/
 *   /{l}/practice/stillness/{focusId}/
 *   /{l}/calendar/{YYYY-MM-DD}/   (day detail; prerender the observance window)
 *   /{l}/journal/new/  and  /{l}/journal/entry/?id=...  (ids are on-device only,
 *   so they use a query string, never a prerendered path)
 * Add them to `routes` when the screens are built.
 */

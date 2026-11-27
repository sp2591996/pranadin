import type { IconName } from "./icons.generated";
import type { MessageKey } from "@/i18n/keys";
import type { Locale } from "@/lib/types";

/**
 * Main navigation (D-036): five clear places on every screen size, nothing
 * hidden under "More". Stories (scripture library) and Yatra (pilgrimage) each get their own place; Sounds is a Practice tab (D-042). Journal is the sixth pill on wide
 * screens and a header button on phones.
 */
export type NavId = "today" | "practice" | "stories" | "yatra" | "calendar" | "journal";

export interface NavItem {
  id: NavId;
  key: MessageKey;
  icon: IconName;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "today", key: "nav.today", icon: "House", path: "today/" },
  { id: "practice", key: "nav.practice", icon: "Wind", path: "practice/" },
  { id: "stories", key: "nav.stories", icon: "BookOpen", path: "stories/" },
  { id: "yatra", key: "nav.yatra", icon: "Bank", path: "yatra/" },
  { id: "calendar", key: "nav.calendar", icon: "CalendarHeart", path: "calendar/" },
  { id: "journal", key: "nav.journal", icon: "Notebook", path: "journal/" },
];

/** The phone bar: the first five. */
export const PHONE_NAV = NAV_ITEMS.filter((n) => n.id !== "journal");

export const navHref = (l: Locale, path: string) => `/${l}/${path}`;

/** Which place is current. Longest matching path wins, so Sounds under Practice highlights Practice. */
export function activeNav(pathname: string, locale: Locale): NavId | null {
  let best: NavItem | null = null;
  for (const n of NAV_ITEMS) {
    const base = navHref(locale, n.path).replace(/\/$/, "");
    if ((pathname === base || pathname.startsWith(base + "/")) && (!best || n.path.length > best.path.length)) best = n;
  }
  return best?.id ?? null;
}

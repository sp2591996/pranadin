import type { IconName } from "./icons.generated";
import type { MessageKey } from "@/i18n/keys";
import type { Locale } from "@/lib/types";

/**
 * Main navigation (D-036): five clear places on every screen size, nothing
 * hidden under "More". Yatra gets its own place (it lives under /practice/
 * in the URL, so it is checked first). Journal is the sixth pill on wide
 * screens and a header button on phones.
 */
export type NavId = "today" | "practice" | "sounds" | "calendar" | "yatra" | "journal";

export interface NavItem {
  id: NavId;
  key: MessageKey;
  icon: IconName;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "today", key: "nav.today", icon: "House", path: "today/" },
  { id: "practice", key: "nav.practice", icon: "Wind", path: "practice/" },
  { id: "sounds", key: "nav.sounds", icon: "Waveform", path: "sounds/" },
  { id: "calendar", key: "nav.calendar", icon: "CalendarHeart", path: "calendar/" },
  { id: "yatra", key: "nav.yatra", icon: "Bank", path: "practice/yatra/" },
  { id: "journal", key: "nav.journal", icon: "Notebook", path: "journal/" },
];

/** The phone bar: the first five. */
export const PHONE_NAV = NAV_ITEMS.filter((n) => n.id !== "journal");

export const navHref = (l: Locale, path: string) => `/${l}/${path}`;

/** Which place is current. Longest matching path wins, so Yatra beats Practice. */
export function activeNav(pathname: string, locale: Locale): NavId | null {
  let best: NavItem | null = null;
  for (const n of NAV_ITEMS) {
    const base = navHref(locale, n.path).replace(/\/$/, "");
    if ((pathname === base || pathname.startsWith(base + "/")) && (!best || n.path.length > best.path.length)) best = n;
  }
  return best?.id ?? null;
}

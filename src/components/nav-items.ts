import type { IconName } from "./icons.generated";
import type { MessageKey } from "@/i18n/keys";
import type { Locale } from "@/lib/types";
import { tabHref, TABS, type Tab } from "@/lib/routes";

/** Tab icons (D-033: same set on the phone bar and the desktop pills). */
export const TAB_ICONS: Record<Tab, IconName> = {
  today: "House",
  practice: "Wind",
  sounds: "Waveform",
  calendar: "CalendarHeart",
  journal: "Notebook",
};

/** Deeper sections reached from the desktop "More" menu. */
export const MORE_ITEMS: { key: MessageKey; deva: string; icon: IconName; path: string }[] = [
  { key: "nav.yoga", deva: "योग", icon: "PersonSimpleTaiChi", path: "practice/yoga/" },
  { key: "nav.chakras", deva: "चक्र", icon: "Sun", path: "practice/chakras/" },
  { key: "nav.yatra", deva: "तीर्थ", icon: "Bank", path: "practice/yatra/" },
  { key: "nav.festivals", deva: "उत्सव", icon: "Flame", path: "calendar/festivals/" },
];

export const moreHref = (l: Locale, path: string) => `/${l}/${path}`;

/** Which tab is current. A "More" section counts as its own, not as its parent tab. */
export function activeNav(pathname: string, locale: Locale): { tab: Tab | null; more: string | null } {
  const more = MORE_ITEMS.find((m) => pathname.startsWith(moreHref(locale, m.path).replace(/\/$/, "")))?.path ?? null;
  const tab = more ? null : (TABS.find((t) => pathname.startsWith(tabHref(locale, t).replace(/\/$/, ""))) ?? null);
  return { tab, more };
}

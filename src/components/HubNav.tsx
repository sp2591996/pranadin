import Link from "next/link";
import { Icon } from "./Icon";
import type { IconName } from "./icons.generated";
import { loadStrings } from "@/features/shared/content.server";
import type { Locale } from "@/lib/types";

type Hub = "practice" | "calendar";

const HUBS: Record<Hub, { label: string; items: { id: string; key: string; icon: IconName; path: string }[] }> = {
  practice: {
    label: "hub.practice.label",
    items: [
      { id: "breath", key: "hub.practice.breath", icon: "Wind", path: "practice/" },
      { id: "yoga", key: "nav.yoga", icon: "PersonSimpleTaiChi", path: "practice/yoga/" },
      { id: "sounds", key: "nav.sounds", icon: "Waveform", path: "practice/sounds/" },
      { id: "chakras", key: "nav.chakras", icon: "Sun", path: "practice/chakras/" },
    ],
  },
  calendar: {
    label: "hub.calendar.label",
    items: [
      { id: "panchang", key: "hub.calendar.panchang", icon: "CalendarHeart", path: "calendar/" },
      { id: "festivals", key: "nav.festivals", icon: "Flame", path: "calendar/festivals/" },
    ],
  },
};

/**
 * Visible sub-sections of a hub (D-036): Practice = Breath & meditation ·
 * Yoga · Sounds · Chakras; Calendar = Panchang · Festivals (D-042). Replaces the hidden
 * "More" menu. Server component, no JavaScript.
 */
export function HubNav({ locale, hub, current }: { locale: Locale; hub: Hub; current: string }) {
  const s = loadStrings(locale, ["hub.", "nav."]);
  const h = HUBS[hub];
  return (
    <nav aria-label={s[h.label]} className="wide mb-6 sm:mb-8">
      <ul className="flex flex-wrap justify-center gap-2">
        {h.items.map((it) => {
          const on = it.id === current;
          return (
            <li key={it.id}>
              <Link
                href={`/${locale}/${it.path}`}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-small font-semibold transition-all duration-fast ${
                  on
                    ? "border-transparent bg-gradient-to-b from-primary to-primary-pressed text-on-primary shadow-md shadow-orange-900/20"
                    : "border-divider bg-surface text-text hover:-translate-y-0.5 hover:border-primary hover:shadow-elev-1"
                }`}
              >
                <Icon name={it.icon} size={18} weight={on ? "fill" : "regular"} />
                {s[it.key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

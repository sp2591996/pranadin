"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import type { IconName } from "./icons.generated";
import { useI18n } from "@/i18n/client";
import { tabHref, TABS, type Tab } from "@/lib/routes";

const ICONS: Record<Tab, IconName> = {
  today: "SunHorizon",
  practice: "Wind",
  sounds: "SpeakerHigh",
  calendar: "CalendarBlank",
  journal: "NotePencil",
};

/**
 * Bottom navigation: 5 tabs, icon + always-visible label, 64px + safe area,
 * active = primary on a primary-tint pill; hidden from tablet width up, where the header holds the tabs with aria-current (design-system-v0 §7).
 */
export function BottomNav() {
  const { t, locale } = useI18n();
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label={t("nav.label")}
      className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t border-divider bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] pb-[env(safe-area-inset-bottom)] shadow-elev-2 backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid min-h-[var(--size-nav)] max-w-xl grid-cols-5">
        {TABS.map((tab) => {
          const href = tabHref(locale, tab);
          const active = pathname.startsWith(href.replace(/\/$/, ""));
          return (
            <li key={tab} className="flex min-w-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 text-label text-[var(--nav-item-fg)] aria-[current=page]:text-[var(--nav-item-active-fg)]"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-12 max-w-full items-center justify-center rounded-full transition-colors duration-fast ${
                    active ? "diya-glow bg-[var(--nav-item-active-bg)]" : ""
                  }`}
                >
                  <Icon name={ICONS[tab]} size={24} weight={active ? "fill" : "regular"} />
                </span>
                <span className="max-w-full text-center leading-tight [overflow-wrap:anywhere]">{t(`nav.${tab}`)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

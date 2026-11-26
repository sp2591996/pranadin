"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { activeNav, TAB_ICONS } from "./nav-items";
import { useI18n } from "@/i18n/client";
import { tabHref, TABS } from "@/lib/routes";

/**
 * Phone tab bar (D-033, after the reference prototype): icon in a soft pill
 * over an always-visible label; active = saffron. Hidden on wide screens,
 * where the header pills take over.
 */
export function BottomNav() {
  const { t, locale } = useI18n();
  const pathname = usePathname() ?? "";
  const { tab: current } = activeNav(pathname, locale);
  return (
    <nav
      aria-label={t("nav.label")}
      className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t border-divider bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <ul className="mx-auto grid min-h-[var(--size-nav)] max-w-2xl grid-cols-5">
        {TABS.map((tab) => {
          // On the phone, a deeper section (Yoga, Yatra, Festivals...) lights up its parent tab.
          const active = current === tab || (current === null && pathname.startsWith(tabHref(locale, tab).replace(/\/$/, "")));
          return (
            <li key={tab} className="flex min-w-0">
              <Link
                href={tabHref(locale, tab)}
                aria-current={active ? "page" : undefined}
                className="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 pb-1 pt-1.5 text-caption text-text-muted transition-colors aria-[current=page]:font-semibold aria-[current=page]:text-primary"
              >
                <span aria-hidden="true" className={`flex h-7 w-10 max-w-full items-center justify-center rounded-full transition-colors ${active ? "bg-primary-tint" : ""}`}>
                  <Icon name={TAB_ICONS[tab]} size={20} weight={active ? "fill" : "regular"} />
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

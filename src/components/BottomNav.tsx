"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { activeNav, navHref, PHONE_NAV } from "./nav-items";
import { useI18n } from "@/i18n/client";

/**
 * Phone tab bar (D-033; places regrouped in D-036): icon in a soft pill
 * over an always-visible label; active = saffron. Hidden on wide screens,
 * where the header pills take over.
 */
export function BottomNav() {
  const { t, locale } = useI18n();
  const pathname = usePathname() ?? "";
  const current = activeNav(pathname, locale);
  return (
    <nav
      aria-label={t("nav.label")}
      className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t border-divider bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <ul className="mx-auto grid min-h-[var(--size-nav)] max-w-2xl grid-cols-5">
        {PHONE_NAV.map((n) => {
          const active = current === n.id;
          return (
            <li key={n.id} className="flex min-w-0">
              <Link
                href={navHref(locale, n.path)}
                aria-current={active ? "page" : undefined}
                className="group relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 pb-1 pt-1.5 text-caption text-text-muted transition-colors aria-[current=page]:font-semibold aria-[current=page]:text-primary"
              >
                <span aria-hidden="true" className={`flex h-7 w-12 max-w-full items-center justify-center rounded-full transition-all duration-base ${active ? "bg-primary-tint scale-105" : "group-active:scale-90"}`}>
                  <Icon name={n.icon} size={20} weight={active ? "fill" : "regular"} />
                </span>
                <span className="max-w-full text-center leading-tight [overflow-wrap:anywhere]">{t(n.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

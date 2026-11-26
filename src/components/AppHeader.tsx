"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { OmMark } from "./OmMark";
import { useI18n } from "@/i18n/client";
import { routes, tabHref, TABS } from "@/lib/routes";

/**
 * Header on every tab (D-033): Om tile, product name with its Devanagari
 * name, and the "Me" (settings) button. From tablet width up it also holds
 * the tab pills; on phones the tabs live in the bottom bar instead.
 */
export function AppHeader() {
  const { t, locale } = useI18n();
  const pathname = usePathname() ?? "";
  return (
    <header className="app-header sticky top-0 z-[var(--z-sticky)] border-b border-divider bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex min-h-[var(--size-appbar)] max-w-6xl items-center justify-between gap-4 px-[var(--size-gutter)] md:min-h-16">
        <Link href={routes.today(locale)} className="flex min-h-11 items-center gap-3 text-text">
          <OmMark />
          <span className="flex flex-col leading-none">
            <span className="flex items-center gap-2 font-display text-[1.5rem] font-semibold leading-none">
              {t("common.appName")}
              <span className="rounded-full border border-divider px-2 py-0.5 font-sans text-caption font-medium text-text-muted">
                {t("common.beta")}
              </span>
            </span>
            {locale === "en" && (
              <span aria-hidden="true" className="mt-1 font-deva text-caption text-primary">
                प्राणदिन
              </span>
            )}
          </span>
        </Link>
        <nav aria-label={t("nav.label")} className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-divider bg-surface p-1 shadow-elev-1">
            {TABS.map((tab) => {
              const href = tabHref(locale, tab);
              const active = pathname.startsWith(href.replace(/\/$/, ""));
              return (
                <li key={tab}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className="inline-flex min-h-11 items-center rounded-full px-4 text-label text-text-muted transition-colors duration-fast hover:text-text aria-[current=page]:bg-primary aria-[current=page]:text-on-primary"
                  >
                    {t(`nav.${tab}`)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="hidden font-deva text-small text-primary lg:inline">
            ॐ शान्तिः
          </span>
          <Link
            href={routes.settings(locale)}
            aria-label={t("a11y.openMe")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-divider bg-surface text-text-muted hover:text-primary"
          >
            <Icon name="UserCircle" size={26} />
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Icon } from "./Icon";
import { activeNav, MORE_ITEMS, moreHref, TAB_ICONS } from "./nav-items";
import { useI18n } from "@/i18n/client";
import { LOCALE_NATIVE_NAME, LOCALES } from "@/i18n/config";
import { getPrefs } from "@/lib/storage";
import { routes, tabHref, TABS, withLocale } from "@/lib/routes";

const SHORT: Record<string, string> = { en: "EN", hi: "हिं", mr: "मरा" };

/** Om logo tile with the small pulsing diya dot (after the reference prototype, D-033). */
export function Logo() {
  const { t, locale } = useI18n();
  return (
    <Link href={routes.today(locale)} className="group flex min-h-11 items-center gap-2.5 rounded-lg px-1">
      <span aria-hidden="true" className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4A2410] to-[#35180A] shadow-md shadow-orange-900/20 transition-transform duration-base group-hover:scale-105">
        <span className="font-deva text-2xl leading-none text-[#F3C35B]">ॐ</span>
        <span className="diya-dot absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#F2B640]" />
      </span>
      <span className="flex flex-col items-start leading-none">
        <span className="font-display text-[1.375rem] font-semibold tracking-tight text-text">{t("common.appName")}</span>
        <span className="mt-0.5 flex items-center gap-1.5">
          {locale === "en" && (
            <span aria-hidden="true" className="font-deva text-[14px] leading-4 text-primary">
              प्राणदिन
            </span>
          )}
          <span className="rounded-full bg-primary-tint px-1.5 text-caption font-semibold leading-5 text-on-primary-tint">{t("common.beta")}</span>
        </span>
      </span>
    </Link>
  );
}

function LangMenu() {
  const { t, locale } = useI18n();
  const pathname = usePathname() ?? "/";
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={ref} className="relative">
      <summary
        className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-full border border-divider bg-surface px-3 text-small font-semibold text-text hover:border-primary [&::-webkit-details-marker]:hidden"
      >
        <Icon name="Globe" size={16} />
        <span lang={locale}>{SHORT[locale]}</span>
        <span className="sr-only">, {t("nav.language")}</span>
      </summary>
      <ul className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-divider bg-surface p-1.5 shadow-elev-3">
        {LOCALES.map((l) => (
          <li key={l}>
            <Link
              lang={l}
              href={withLocale(pathname, l)}
              aria-current={l === locale ? "true" : undefined}
              onClick={() => {
                ref.current?.removeAttribute("open");
                if (l !== locale) getPrefs().write({ locale: l });
              }}
              className="flex min-h-11 items-center rounded-xl px-3 text-small font-medium hover:bg-surface-2 aria-[current=true]:bg-primary-tint aria-[current=true]:text-on-primary-tint"
            >
              {LOCALE_NATIVE_NAME[l]}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * Header on every tab (D-033, after the reference prototype): logo, the tab
 * pills with a "More" menu on wide screens, language menu, ॐ शान्तिः and "Me".
 * On phones the tabs live in the bottom bar instead.
 */
export function AppHeader() {
  const { t, locale } = useI18n();
  const pathname = usePathname() ?? "";
  const { tab: activeTab, more } = activeNav(pathname, locale);
  const moreRef = useRef<HTMLDetailsElement>(null);
  const pill = "flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-small font-medium transition-colors duration-fast";
  const idle = "text-text-muted hover:bg-surface-2 hover:text-text";
  const on = "bg-primary text-on-primary shadow-md shadow-orange-900/20";
  return (
    <header className="app-header sticky top-0 z-[var(--z-sticky)] border-b border-divider bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label={t("nav.label")} className="hidden lg:block">
          <ul className="flex items-center gap-1 rounded-full border border-divider bg-surface/70 p-1 shadow-sm">
            {TABS.map((tab) => (
              <li key={tab}>
                <Link href={tabHref(locale, tab)} aria-current={activeTab === tab ? "page" : undefined} className={`${pill} ${activeTab === tab ? on : idle}`}>
                  <Icon name={TAB_ICONS[tab]} size={16} />
                  {t(`nav.${tab}`)}
                </Link>
              </li>
            ))}
            <li>
              <details ref={moreRef} className="relative">
                <summary className={`${pill} cursor-pointer list-none [&::-webkit-details-marker]:hidden ${more ? on : idle}`}>
                  <Icon name="DotsThree" size={16} />
                  {t("nav.more")}
                </summary>
                <ul className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-divider bg-surface p-1.5 shadow-elev-3">
                  {MORE_ITEMS.map((m) => (
                    <li key={m.path}>
                      <Link
                        href={moreHref(locale, m.path)}
                        aria-current={more === m.path ? "page" : undefined}
                        onClick={() => moreRef.current?.removeAttribute("open")}
                        className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-small font-medium text-text hover:bg-surface-2 aria-[current=page]:bg-primary-tint aria-[current=page]:text-on-primary-tint"
                      >
                        <Icon name={m.icon} size={16} className="text-text-muted" />
                        <span className="flex-1">{t(m.key)}</span>
                        {locale === "en" && (
                          <span aria-hidden="true" className="font-deva text-caption text-text-muted">
                            {m.deva}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <LangMenu />
          <span aria-hidden="true" className="hidden font-deva text-small text-primary xl:block">
            ॐ शान्तिः
          </span>
          <Link
            href={routes.settings(locale)}
            aria-label={t("a11y.openMe")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-divider bg-surface text-text-muted hover:border-primary hover:text-primary"
          >
            <Icon name="UserCircle" size={24} />
          </Link>
        </div>
      </div>
    </header>
  );
}

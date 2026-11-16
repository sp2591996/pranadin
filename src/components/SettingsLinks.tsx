"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { LOCALE_NATIVE_NAME, LOCALES } from "@/i18n/config";
import { routes, TRUST_PAGES } from "@/lib/routes";

/** Minimal settings body: language switcher and trust-page links. Dev-2 builds the full screen. */
export function SettingsLinks() {
  const { t, locale } = useI18n();
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="lang-h">
        <h2 id="lang-h" className="mb-2 text-[18px] leading-[26px]">
          {t("common.languageLabel")}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {LOCALES.map((l) => (
            <li key={l}>
              <Link
                lang={l}
                href={routes.settings(l)}
                aria-current={l === locale ? "true" : undefined}
                className="flex min-h-11 items-center rounded-md border border-border-input px-4 aria-[current=true]:bg-primary-tint aria-[current=true]:text-primary"
              >
                {LOCALE_NATIVE_NAME[l]}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <nav aria-labelledby="trust-h">
        <h2 id="trust-h" className="mb-2 text-[18px] leading-[26px]">
          {t("settings.privacy")}
        </h2>
        <ul className="divide-y divide-divider rounded-lg border border-divider bg-surface">
          {TRUST_PAGES.map((p) => (
            <li key={p}>
              <Link href={routes.trust(locale, p)} className="flex min-h-14 items-center px-4">
                {t(`trust.${p}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

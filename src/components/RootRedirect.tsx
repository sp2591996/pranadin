"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LOCALE_NATIVE_NAME, LOCALES, negotiateLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { routes } from "@/lib/routes";
import { getPrefs } from "@/lib/storage";

/**
 * `/`: send the user to their stored or browser language. Until JS runs (or
 * if it never does) the page shows plain links to all three languages.
 */
export function RootRedirect() {
  useEffect(() => {
    const prefs = getPrefs().read();
    const locale = negotiateLocale(prefs.onboarded ? prefs.locale : null, navigator.languages ?? []);
    window.location.replace(prefs.onboarded ? routes.today(locale) : routes.onboarding(locale));
  }, []);
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-[var(--gutter)]">
      <h1>PranaDin</h1>
      {/* Only language names appear in HI/MR here: other HI/MR copy must be Board-reviewed first. */}
      <p className="text-text-muted">Choose your language</p>
      <ul className="flex flex-col gap-3">
        {LOCALES.map((l) => (
          <li key={l}>
            <Link
              lang={l}
              href={routes.onboarding(l)}
              className="flex min-h-12 items-center rounded-md border border-border-input bg-surface px-4 text-[18px] text-text"
            >
              {LOCALE_NATIVE_NAME[l]}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

/** `/{locale}/`: go to Today, or to onboarding on first run. */
export function LocaleHomeRedirect() {
  const { locale, t } = useI18n();
  useEffect(() => {
    const prefs = getPrefs().read();
    window.location.replace(prefs.onboarded ? routes.today(locale) : routes.onboarding(locale));
  }, [locale]);
  return (
    <main className="mx-auto max-w-xl px-[var(--gutter)] py-8">
      <Link href={routes.today(locale)} className="text-primary underline">
        {t("nav.today")}
      </Link>
    </main>
  );
}

"use client";

import { useI18n } from "@/i18n/client";

/**
 * On hi/mr pages, says plainly that unreviewed text is shown in English
 * (IA principle 6: never mix languages silently). Hidden once every string
 * on the locale is reviewed.
 */
export function FallbackNote() {
  const { t, locale, fallbackCount } = useI18n();
  if (locale === "en" || fallbackCount === 0) return null;
  return (
    <p role="note" className="mb-4 rounded-md border border-divider bg-surface-2 px-3 py-2 text-small text-text-muted">
      {t("lang.fallback", { language: t(locale === "hi" ? "lang.name.hi" : "lang.name.mr") })}
    </p>
  );
}

"use client";

import { useI18n } from "@/i18n/client";
import { LOCALE_NATIVE_NAME } from "@/i18n/config";

/**
 * On hi/mr pages, says plainly that unreviewed text is shown in English
 * (IA principle 6: never mix languages silently). Hidden once every string
 * on the locale is reviewed. `force` shows it for a whole item shown in
 * English (e.g. a trust page not yet translated).
 */
export function FallbackNote({ force = false }: { force?: boolean }) {
  const { t, locale, fallbackCount } = useI18n();
  if (locale === "en" || (fallbackCount === 0 && !force)) return null;
  return (
    <p role="note" className="mb-4 rounded-md border border-divider bg-surface-2 px-3 py-2 text-small text-text-muted">
      {t("lang.fallback", { language: LOCALE_NATIVE_NAME[locale] })}
    </p>
  );
}

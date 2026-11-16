"use client";

import { useI18n } from "@/i18n/client";

export function SkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-3 focus:text-text"
    >
      {t("nav.skipToContent")}
    </a>
  );
}

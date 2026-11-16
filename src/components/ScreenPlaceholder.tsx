"use client";

import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/catalog";

/** Temporary body for screens other lanes are building. */
export function ScreenPlaceholder({ titleKey, owner }: { titleKey: MessageKey; owner: string }) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="screen-title" className="flex flex-col gap-4">
      <h1 id="screen-title">{t(titleKey)}</h1>
      <div className="rounded-lg border border-divider bg-surface p-4 text-text-muted">
        <p>{t("common.comingSoon")}</p>
        <p className="mt-2 text-[14px] leading-5" lang="en">
          Owner: {owner}
        </p>
      </div>
    </section>
  );
}

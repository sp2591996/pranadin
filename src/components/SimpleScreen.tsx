"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/catalog";
import { routes } from "@/lib/routes";

/** Full-screen page outside the tabs (onboarding, settings, trust pages): app bar with Back. */
export function SimpleScreen({ titleKey, children }: { titleKey: MessageKey; children?: ReactNode }) {
  const { t, locale } = useI18n();
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-divider bg-bg">
        <div className="mx-auto flex h-[var(--app-bar-h)] max-w-xl items-center gap-2 px-2">
          <Link
            href={routes.today(locale)}
            aria-label={t("nav.back")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-text hover:bg-surface-2"
          >
            <ArrowLeftIcon size={24} aria-hidden="true" />
          </Link>
          <h1 className="text-[22px] leading-[30px]">{t(titleKey)}</h1>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-xl px-[var(--gutter)] py-6">
        {children ?? <p className="text-text-muted">{t("common.comingSoon")}</p>}
      </main>
    </>
  );
}

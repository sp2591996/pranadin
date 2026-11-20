"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FallbackNote } from "./FallbackNote";
import { Icon } from "./Icon";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/keys";
import { routes } from "@/lib/routes";

/** Full-screen page outside the tabs (onboarding, settings, trust pages): app bar with Back. */
export function SimpleScreen({
  titleKey,
  title,
  children,
  englishOnly = false,
  titleLang,
}: {
  titleKey?: MessageKey;
  /** Already-localized title (e.g. from a trust page file). */
  title?: string;
  children?: ReactNode;
  /** The page body is shown in English on a hi/mr screen (US-02). */
  englishOnly?: boolean;
  /** Language of `title` when it differs from the page language. */
  titleLang?: string;
}) {
  const { t, locale } = useI18n();
  return (
    <>
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-divider bg-bg">
        <div className="mx-auto flex h-[var(--size-appbar)] max-w-xl items-center gap-2 px-2">
          <Link
            href={routes.today(locale)}
            aria-label={t("common.back")}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-text hover:bg-surface-2"
          >
            <Icon name="ArrowLeft" size={24} />
          </Link>
          <h1 className="text-h2" lang={titleLang}>{title ?? (titleKey ? t(titleKey) : "")}</h1>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-xl px-[var(--size-gutter)] py-6">
        <FallbackNote force={englishOnly} />
        {children}
      </main>
    </>
  );
}

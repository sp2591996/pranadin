"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { useI18n } from "@/i18n/client";
import { routes } from "@/lib/routes";

/** Header on every tab: product name, beta badge and the "Me" (settings) button. */
export function AppHeader() {
  const { t, locale } = useI18n();
  return (
    <header className="fest-header sticky top-0 z-[var(--z-sticky)] bg-bg">
      <div className="mx-auto flex h-[var(--size-appbar)] max-w-xl items-center justify-between px-[var(--size-gutter)]">
        <Link
          href={routes.today(locale)}
          className="flex min-h-11 items-center gap-2 font-display text-h2 text-text"
        >
          {t("common.appName")}
          <span className="rounded-full border border-border-input px-2 text-caption text-text-muted">
            {t("common.beta")}
          </span>
        </Link>
        <Link
          href={routes.settings(locale)}
          aria-label={t("a11y.openMe")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-surface-2"
        >
          <Icon name="UserCircle" size={28} />
        </Link>
      </div>
    </header>
  );
}

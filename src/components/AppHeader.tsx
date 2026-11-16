"use client";

import Link from "next/link";
import { UserCircleIcon } from "@phosphor-icons/react/dist/csr/UserCircle";
import { useI18n } from "@/i18n/client";
import { routes } from "@/lib/routes";

/** Header on every tab: product name, beta badge and the "Me" (settings) button. */
export function AppHeader() {
  const { t, locale } = useI18n();
  return (
    <header className="sticky top-0 z-10 border-b border-divider bg-bg">
      <div className="mx-auto flex h-[var(--app-bar-h)] max-w-xl items-center justify-between px-[var(--gutter)]">
        <Link
          href={routes.today(locale)}
          className="flex min-h-11 items-center gap-2 font-display text-[22px] font-semibold text-text"
        >
          {t("app.name")}
          <span className="rounded-full border border-border-input px-2 text-[12px] leading-4 font-medium text-text-muted">
            {t("app.betaBadge")}
          </span>
        </Link>
        <Link
          href={routes.settings(locale)}
          aria-label={t("nav.me")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-surface-2"
        >
          <UserCircleIcon size={28} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

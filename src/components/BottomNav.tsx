"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { NotePencilIcon } from "@phosphor-icons/react/dist/csr/NotePencil";
import { SunHorizonIcon } from "@phosphor-icons/react/dist/csr/SunHorizon";
import { WindIcon } from "@phosphor-icons/react/dist/csr/Wind";
import type { IconProps } from "@phosphor-icons/react/dist/lib/types";
import { useI18n } from "@/i18n/client";
import { tabHref, TABS, type Tab } from "@/lib/routes";

const ICONS: Record<Tab, ComponentType<IconProps>> = {
  today: SunHorizonIcon,
  practice: WindIcon,
  calendar: CalendarBlankIcon,
  journal: NotePencilIcon,
};

/**
 * Bottom navigation: 4 tabs, icon + always-visible label, 64px + safe area,
 * active = primary on a primary-tint pill with aria-current (design-system-v0 §7).
 */
export function BottomNav() {
  const { t, locale } = useI18n();
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label={t("nav.label")}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-divider bg-surface pb-[env(safe-area-inset-bottom)] [box-shadow:var(--elev-2)]"
    >
      <ul className="mx-auto grid h-[var(--bottom-nav-h)] max-w-xl grid-cols-4">
        {TABS.map((tab) => {
          const href = tabHref(locale, tab);
          const active = pathname.startsWith(href.replace(/\/$/, ""));
          const Icon = ICONS[tab];
          return (
            <li key={tab} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[15px] leading-5 font-medium text-[var(--nav-item-fg)] aria-[current=page]:text-[var(--nav-item-active-fg)]"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150 ${
                    active ? "bg-[var(--nav-item-active-bg)]" : ""
                  }`}
                >
                  <Icon size={24} weight={active ? "fill" : "regular"} />
                </span>
                <span>{t(`nav.${tab}`)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

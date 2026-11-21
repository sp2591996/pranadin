"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { Mandala } from "@/components/Mandala";
import { useI18n } from "@/i18n/client";
import { formatDateKey } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { routes } from "@/lib/routes";
import { useS } from "@/features/shared/strings";
import { btn } from "@/features/shared/ui";
import { festivalRoutes } from "./routes";
import type { FestivalTradition, FestivalView } from "./types";

const monthName = (m: number, locale: Locale) => formatDateKey(`2027-${String(m).padStart(2, "0")}-01`, locale, { month: "long" });

/** Festivals list (D-026 Wave D): filter by tradition and by month. */
export function FestivalList({ festivals, traditions }: { festivals: FestivalView[]; traditions: FestivalTradition[] }) {
  const s = useS();
  const { t, locale } = useI18n();
  const [tradition, setTradition] = useState<FestivalTradition | "all">("all");
  const [month, setMonth] = useState<number>(0);
  const shown = useMemo(
    () => festivals.filter((f) => (tradition === "all" || f.traditions.includes(tradition)) && (month === 0 || f.months.includes(month))),
    [festivals, tradition, month],
  );
  return (
    <div className="flex flex-col gap-5">
      <Link href={routes.calendar(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
        {s("festivals.backToCalendar")}
      </Link>
      <header className="relative isolate overflow-hidden rounded-lg border-2 border-[var(--card-border)] bg-[var(--card-hero-bg)] p-4">
        <Mandala className="absolute -right-10 -top-10 -z-10 h-40 w-40 text-[var(--accent)] opacity-40" />
        <h1>{s("festivals.title")}</h1>
        <p className="text-text-muted">{s("festivals.intro")}</p>
      </header>

      <div role="group" aria-label={s("festivals.filter.tradition")} className="flex flex-wrap gap-2">
        <button type="button" className={btn.chip} aria-pressed={tradition === "all"} onClick={() => setTradition("all")}>
          {s("festivals.filter.all")}
        </button>
        {traditions.map((tr) => (
          <button key={tr} type="button" className={btn.chip} aria-pressed={tradition === tr} onClick={() => setTradition(tr)}>
            {t(`tradition.${tr}`)}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-small text-text-muted">{s("festivals.filter.month")}</span>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="min-h-11 rounded-md border border-border-input bg-surface px-3">
          <option value={0}>{s("festivals.filter.allMonths")}</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {monthName(m, locale)}
            </option>
          ))}
        </select>
      </label>

      <p role="status" className="text-small text-text-muted">
        {s("festivals.count", { count: shown.length })}
      </p>
      {shown.length === 0 ? (
        <p className="text-text-muted">{s("festivals.none")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((f) => (
            <li key={f.id}>
              <Link
                href={festivalRoutes.detail(locale, f.id)}
                className="flex min-h-20 items-center gap-3 rounded-lg border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-3 hover:bg-surface-2"
              >
                <span className="flex-1">
                  <span className="block text-h3" lang={f.name.lang}>
                    {f.name.text}
                  </span>
                  <span className="block text-small text-text-muted" lang={f.tagline.lang}>
                    {f.tagline.text}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-2">
                    {f.traditions.map((tr) => (
                      <span key={tr} className="rounded-full bg-[var(--tradition-tag-bg)] px-2 text-caption text-[var(--tradition-tag-fg)]">
                        {t(`tradition.${tr}`)}
                      </span>
                    ))}
                    <span className="text-caption text-text-muted">{f.months.map((m) => monthName(m, locale)).join(" · ")}</span>
                  </span>
                </span>
                <CaretRightIcon size={20} aria-hidden="true" className="text-text-muted rtl:-scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

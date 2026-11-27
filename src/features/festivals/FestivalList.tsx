"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/i18n/client";
import { formatDateKey } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { useS } from "@/features/shared/strings";
import { btn } from "@/features/shared/ui";
import { TRAD_ART } from "./art";
import { festivalRoutes } from "./routes";
import type { FestivalTradition, FestivalView } from "./types";
import { SectionHeader } from "@/components/SectionHeader";

const monthName = (m: number, locale: Locale) =>
  formatDateKey(`2027-${String(m).padStart(2, "0")}-01`, locale, {
    month: "long",
  });

/** Card band from the brand palette (D-037); the tradition name is in the tag. */
/** Festivals list (D-026 Wave D): filter by tradition and by month. */
export function FestivalList({
  festivals,
  traditions,
}: {
  festivals: FestivalView[];
  traditions: FestivalTradition[];
}) {
  const s = useS();
  const { t, locale } = useI18n();
  const [tradition, setTradition] = useState<FestivalTradition | "all">("all");
  const [month, setMonth] = useState<number>(0);
  const shown = useMemo(
    () =>
      festivals.filter(
        (f) =>
          (tradition === "all" || f.traditions.includes(tradition)) &&
          (month === 0 || f.months.includes(month)),
      ),
    [festivals, tradition, month],
  );
  return (
    <div className="wide flex flex-col gap-6">
      <SectionHeader
        deva="उत्सव"
        title={s("festivals.title")}
        intro={s("festivals.intro")}
      />

      <div className="mx-auto grid w-full max-w-4xl gap-4 rounded-[var(--r-xl)] border border-divider bg-surface p-5 shadow-elev-1 md:grid-cols-2">
        <div
          role="group"
          aria-label={s("festivals.filter.tradition")}
          className="flex flex-wrap gap-2 md:col-span-2"
        >
          <button
            type="button"
            className={btn.chip}
            aria-pressed={tradition === "all"}
            onClick={() => setTradition("all")}
          >
            {s("festivals.filter.all")}
          </button>
          {traditions.map((tr) => (
            <button
              key={tr}
              type="button"
              className={btn.chip}
              aria-pressed={tradition === tr}
              onClick={() => setTradition(tr)}
            >
              {t(`tradition.${tr}`)}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-small text-text-muted">
            {s("festivals.filter.month")}
          </span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="min-h-11 rounded-xl border border-border-input bg-surface px-3"
          >
            <option value={0}>{s("festivals.filter.allMonths")}</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {monthName(m, locale)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p role="status" className="text-small text-text-muted">
        {s("festivals.count", { count: shown.length })}
      </p>
      {shown.length === 0 ? (
        <p className="text-text-muted">{s("festivals.none")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((f) => (
            <li key={f.id} className="flex">
              <Link
                href={festivalRoutes.detail(locale, f.id)}
                className="card-lift group flex flex-1 flex-col overflow-hidden rounded-[var(--r-xl)] border border-divider bg-surface shadow-elev-1"
              >
                <span
                  className={`relative flex h-24 items-start justify-between gap-3 overflow-hidden p-4 text-white ${TRAD_ART[f.traditions[0]] ?? TRAD_ART.hindu}`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-6 -right-4 text-white/15 transition-transform duration-slow group-hover:scale-110"
                  >
                    <Icon name="Flame" size={112} weight="fill" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="glass flex h-11 w-11 items-center justify-center rounded-full"
                  >
                    <Icon name="Flame" size={22} />
                  </span>
                  <span className="relative flex flex-wrap justify-end gap-1.5">
                    {f.traditions.map((tr) => (
                      <span
                        key={tr}
                        className="glass rounded-full px-2.5 py-0.5 text-caption font-semibold text-white"
                      >
                        {t(`tradition.${tr}`)}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="flex flex-1 flex-col gap-2 p-5">
                  <span
                    className="block font-display text-[1.375rem] font-semibold leading-tight"
                    lang={f.name.lang}
                  >
                    {f.name.text}
                  </span>
                  <span
                    className="block font-display text-[1.0625rem] italic leading-snug text-primary"
                    lang={f.tagline.lang}
                  >
                    {f.tagline.text}
                  </span>
                  <span className="mt-auto flex items-center gap-1.5 text-caption text-text-muted">
                    <Icon name="CalendarHeart" size={14} />
                    {f.months.map((m) => monthName(m, locale)).join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { Mandala } from "@/components/Mandala";
import { useI18n } from "@/i18n/client";
import { formatDateKey } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { useS } from "@/features/shared/strings";
import { btn } from "@/features/shared/ui";
import type { FestivalTradition } from "@/features/festivals/types";
import { yatraRoutes } from "./routes";
import type { PlaceView } from "./types";

export const monthName = (m: number, locale: Locale) => formatDateKey(`2027-${String(m).padStart(2, "0")}-01`, locale, { month: "long" });

/** Yatra place list: filter by state, tradition and month to visit. */
export function YatraList({ places }: { places: PlaceView[] }) {
  const s = useS();
  const { t, locale } = useI18n();
  const [state, setState] = useState("all");
  const [tradition, setTradition] = useState<FestivalTradition | "all">("all");
  const [month, setMonth] = useState(0);
  const states = useMemo(() => [...new Map(places.map((p) => [p.stateKey, p.state])).entries()], [places]);
  const traditions = useMemo(() => [...new Set(places.flatMap((p) => p.traditions))], [places]);
  const shown = useMemo(
    () =>
      places.filter(
        (p) => (state === "all" || p.stateKey === state) && (tradition === "all" || p.traditions.includes(tradition)) && (month === 0 || p.bestMonths.includes(month)),
      ),
    [places, state, tradition, month],
  );
  const select = "min-h-11 rounded-md border border-border-input bg-surface px-3";
  return (
    <div className="flex flex-col gap-5">
      <header className="relative isolate overflow-hidden rounded-lg border-2 border-[var(--card-border)] bg-[var(--card-hero-bg)] p-4">
        <Mandala className="absolute -right-10 -top-10 -z-10 h-40 w-40 text-[var(--accent)] opacity-40" />
        <h1>{s("yatra.title")}</h1>
        <p className="text-text-muted">{s("yatra.intro")}</p>
        <Link href={yatraRoutes.planner(locale)} className={`${btn.secondary} mt-3`}>
          {s("yatra.planner.open")}
        </Link>
      </header>

      <label className="flex flex-col gap-1">
        <span className="text-small text-text-muted">{s("yatra.filter.state")}</span>
        <select value={state} onChange={(e) => setState(e.target.value)} className={select}>
          <option value="all">{s("yatra.filter.allStates")}</option>
          {states.map(([k, name]) => (
            <option key={k} value={k} lang={name.lang}>
              {name.text}
            </option>
          ))}
        </select>
      </label>
      <div role="group" aria-label={s("yatra.filter.tradition")} className="flex flex-wrap gap-2">
        <button type="button" className={btn.chip} aria-pressed={tradition === "all"} onClick={() => setTradition("all")}>
          {s("yatra.filter.allTraditions")}
        </button>
        {traditions.map((tr) => (
          <button key={tr} type="button" className={btn.chip} aria-pressed={tradition === tr} onClick={() => setTradition(tr)}>
            {t(`tradition.${tr}`)}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-small text-text-muted">{s("yatra.filter.month")}</span>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={select}>
          <option value={0}>{s("yatra.filter.allMonths")}</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {monthName(m, locale)}
            </option>
          ))}
        </select>
      </label>

      <p role="status" className="text-small text-text-muted">
        {s("yatra.count", { count: shown.length })}
      </p>
      {shown.length === 0 ? (
        <p className="text-text-muted">{s("yatra.none")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((p) => (
            <li key={p.id}>
              <Link
                href={yatraRoutes.detail(locale, p.id)}
                className="flex min-h-20 items-center gap-3 rounded-lg border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-3 hover:bg-surface-2"
              >
                <span className="flex-1">
                  <span className="block text-h3" lang={p.name.lang}>
                    {p.name.text}
                  </span>
                  <span className="block text-small text-text-muted" lang={p.state.lang}>
                    {p.state.text}
                  </span>
                  <span className="block text-small text-text-muted" lang={p.tagline.lang}>
                    {p.tagline.text}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-2">
                    {p.traditions.map((tr) => (
                      <span key={tr} className="rounded-full bg-[var(--tradition-tag-bg)] px-2 text-caption text-[var(--tradition-tag-fg)]">
                        {t(`tradition.${tr}`)}
                      </span>
                    ))}
                    <span className="text-caption text-text-muted">{s("yatra.bestIn", { months: p.bestMonths.map((m) => monthName(m, locale)).join(" · ") })}</span>
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

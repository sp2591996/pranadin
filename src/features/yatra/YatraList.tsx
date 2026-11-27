"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { btn } from "@/features/shared/ui";
import type { FestivalTradition } from "@/features/festivals/types";
import { yatraRoutes } from "./routes";
import type { PlaceView } from "./types";
import { SectionHeader } from "@/components/SectionHeader";

import { monthName } from "./month";

export { monthName };

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
  const select = "min-h-11 rounded-xl border border-border-input bg-surface px-3";
  return (
    <div className="wide flex flex-col gap-6">
      <SectionHeader deva="तीर्थयात्रा" title={s("yatra.title")} intro={s("yatra.intro")}>
        <Link href={yatraRoutes.planner(locale)} className={`${btn.primary} mt-5`}>
          {s("yatra.planner.open")}
        </Link>
      </SectionHeader>

      <div className="mx-auto grid w-full max-w-4xl gap-4 rounded-[var(--r-xl)] border border-divider bg-surface p-5 shadow-elev-1 md:grid-cols-2">
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
      <div role="group" aria-label={s("yatra.filter.tradition")} className="flex flex-wrap gap-2 md:col-span-2">
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
      </div>

      <p role="status" className="text-small text-text-muted">
        {s("yatra.count", { count: shown.length })}
      </p>
      {shown.length === 0 ? (
        <p className="text-text-muted">{s("yatra.none")}</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => {
            const photo = p.photos[0];
            // Magazine layout (D-036): the first place is the large featured card.
            const big = i === 0;
            return (
              <li key={p.id} className={big ? "flex sm:col-span-2 lg:row-span-2" : "flex"}>
                <Link href={yatraRoutes.detail(locale, p.id)} className="card-lift group flex flex-1 flex-col overflow-hidden rounded-2xl border border-divider bg-surface shadow-elev-1">
                  <span className={`hero-dark relative block aspect-[16/10] overflow-hidden ${big ? "lg:aspect-auto lg:min-h-[24rem] lg:flex-1" : ""}`}>
                    {photo ? (
                      <Image src={`/yatra/${p.id}/${photo.file}`} alt="" fill sizes={big ? "(min-width: 1024px) 740px, 100vw" : "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"} className="object-cover transition-transform duration-slow group-hover:scale-105" />
                    ) : (
                      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-deva text-5xl text-[#F3C35B]/70">
                        ॐ
                      </span>
                    )}
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <span className={`absolute bottom-3 left-4 right-4 font-display font-semibold leading-tight text-white drop-shadow ${big ? "text-[2rem] sm:text-[2.75rem]" : "text-[1.5rem]"}`} lang={p.name.lang}>
                      {p.name.text}
                    </span>
                    {photo?.ai ? <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[0.75rem] font-medium text-white">{s("yatra.aiImage")}</span> : null}
                  </span>
                  <span className={`flex flex-col gap-2 p-4 ${big ? "" : "flex-1"}`}>
                    <span className="flex items-center gap-1.5 text-small text-text-muted" lang={p.state.lang}>
                      <Icon name="MapPin" size={14} />
                      {p.state.text}
                    </span>
                    <span className="font-display text-[1.125rem] italic leading-snug text-primary" lang={p.tagline.lang}>
                      {p.tagline.text}
                    </span>
                    <span className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {p.traditions.map((tr) => (
                        <span key={tr} className="rounded-full bg-[var(--tradition-tag-bg)] px-2.5 py-0.5 text-caption font-medium text-[var(--tradition-tag-fg)]">
                          {t(`tradition.${tr}`)}
                        </span>
                      ))}
                    </span>
                    <span className="flex items-center gap-1.5 text-caption text-text-muted">
                      <Icon name="CalendarHeart" size={14} />
                      {s("yatra.bestIn", { months: p.bestMonths.map((m) => monthName(m, locale)).join(" · ") })}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

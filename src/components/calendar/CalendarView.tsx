"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Observance } from "@/content/load";
import { ObservanceBody, ObservanceName } from "@/components/ObservanceBody";
import { useLocalDay } from "@/components/useLocalDay";
import { useI18n } from "@/i18n/client";
import { formatDateKey, formatTime } from "@/i18n/format";
import { masaKey, nakshatraKey, tithiKey } from "@/i18n/keys";
import { inWindow, observancesOn, upcoming } from "@/lib/observances";
import { panchangForDay } from "@/lib/panchang";
import { routes } from "@/lib/routes";
import type { LocalDateKey, PanchangDay } from "@/lib/types";
import { monthGrid, monthOf, shiftMonth, type MonthKey } from "./month";

type Tradition = Observance["traditions"][number];

/**
 * Calendar tab (E-06, US-18, US-19; Design C1 + C2). Month grid with
 * observance dots, tradition filter chips, a "Next 7 days" list (a non-grid
 * route to every item), and the selected day's detail: indicative panchang
 * for the user's city plus that day's observances with sources.
 * Day detail is shown below the grid rather than as a pushed screen, so it
 * works as one static page.
 */
export function CalendarView({
  observances,
  window,
  traditions,
  buildDate,
}: {
  observances: Observance[];
  window: { from: string; to: string };
  traditions: Tradition[];
  buildDate: string;
}) {
  const { t, locale } = useI18n();
  const day = useLocalDay(buildDate);
  const today = day.dateKey;

  // Month and selection follow "today" until the user picks something.
  const [picked, setPicked] = useState<{ month: MonthKey; selected: LocalDateKey } | null>(null);
  const month = picked?.month ?? monthOf(today);
  const selected = picked?.selected ?? today;
  const [filter, setFilter] = useState<Tradition[]>([]);

  const shown = useMemo(
    () => (filter.length === 0 ? observances : observances.filter((o) => o.traditions.some((tr) => filter.includes(tr)))),
    [observances, filter],
  );
  const weeks = useMemo(() => monthGrid(month), [month]);
  const monthTitle = formatDateKey(`${month}-01`, locale, { month: "long", year: "numeric" });
  const weekdayNames = weeks[0]!.map((d) => ({
    short: formatDateKey(d, locale, { weekday: "narrow" }),
    long: formatDateKey(d, locale, { weekday: "long" }),
  }));

  const select = (d: LocalDateKey) => setPicked({ month: monthOf(d), selected: d });
  const go = (delta: number) => {
    const m = shiftMonth(month, delta);
    setPicked({ month: m, selected: monthOf(selected) === m ? selected : `${m}-01` });
  };
  const toggle = (tr: Tradition) => setFilter((f) => (f.includes(tr) ? f.filter((x) => x !== tr) : [...f, tr]));

  const next = upcoming(shown, today, 7);
  const dayItems = observancesOn(shown, selected);
  const after = selected > window.to;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="sr-only">{t("cal.title")}</h1>

      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => go(-1)} className="flex size-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={t("cal.prev")}>
          <Chevron dir="left" />
        </button>
        <h2 className="text-h2" aria-live="polite" id="cal-month">
          {monthTitle}
        </h2>
        <button type="button" onClick={() => go(1)} className="flex size-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={t("cal.next")}>
          <Chevron dir="right" />
        </button>
      </div>

      <div role="group" aria-label={t("cal.filter.label")} className="-mx-1 flex flex-wrap gap-2 px-1">
        <Chip pressed={filter.length === 0} onClick={() => setFilter([])}>
          {t("cal.filter.all")}
        </Chip>
        {traditions.map((tr) => (
          <Chip key={tr} pressed={filter.includes(tr)} onClick={() => toggle(tr)}>
            {t(`tradition.${tr}`)}
          </Chip>
        ))}
      </div>

      <table className="w-full table-fixed border-collapse text-center" aria-labelledby="cal-month">
        <thead>
          <tr>
            {weekdayNames.map((w) => (
              <th key={w.long} scope="col" className="pb-1 text-caption font-medium text-text-muted">
                <abbr title={w.long} className="no-underline">
                  {w.short}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((d) => {
                const inMonth = monthOf(d) === month;
                const n = observancesOn(shown, d).length;
                const isToday = day.live && d === today;
                const isSel = d === selected;
                const label = `${formatDateKey(d, locale, { weekday: "long", day: "numeric", month: "long" })}${n ? `, ${t("cal.day.observances")}: ${n}` : ""}`;
                return (
                  <td key={d} className="p-0">
                    <button
                      type="button"
                      onClick={() => select(d)}
                      aria-label={label}
                      aria-pressed={isSel}
                      aria-current={isToday ? "date" : undefined}
                      className={`relative mx-auto flex h-11 w-full max-w-11 flex-col items-center justify-center rounded-full text-body ${
                        isToday ? "bg-primary font-bold text-on-primary" : inMonth ? "" : "text-text-muted"
                      } ${isSel && !isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                    >
                      {Number(d.slice(8))}
                      {n > 0 && (
                        <span aria-hidden className={`absolute bottom-0.5 size-1.5 rounded-full ${isToday ? "bg-on-primary" : "bg-secondary"}`} />
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <section aria-labelledby="day-title" className="flex flex-col gap-3">
        <h2 id="day-title" className="text-h3">
          {formatDateKey(selected, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </h2>
        {day.live ? <DayPanchang date={selected} city={day.city} citySet={day.citySet} /> : <div className="min-h-[280px]" aria-busy="true" />}

        <h3 className="text-h3">{t("cal.day.observances")}</h3>
        {dayItems.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {dayItems.map((o) => (
              <li key={o.id} className="rounded-lg border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                <p className="text-h3">
                  <ObservanceName o={o} />
                </p>
                <ObservanceBody o={o} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">{after ? t("cal.outOfRange") : t("cal.none")}</p>
        )}
      </section>

      <section aria-labelledby="next7-title">
        <h2 id="next7-title" className="mb-2 text-h3">
          {t("cal.next7")}
        </h2>
        {!(inWindow(window, today) || today < window.from) ? (
          <p className="text-text-muted">{t("cal.outOfRange")}</p>
        ) : next.length === 0 ? (
          <p className="text-text-muted">{t("cal.noneWeek")}</p>
        ) : (
          <ul className="divide-y divide-divider rounded-lg border border-divider bg-surface">
            {next.flatMap((g) =>
              g.items.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => select(g.date)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left">
                    <span>
                      <span className="block font-semibold">
                        <ObservanceName o={o} />
                      </span>
                      <span className="block text-small text-text-muted">
                        {formatDateKey(g.date, locale, { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[var(--tradition-tag-bg)] px-2 text-caption text-[var(--tradition-tag-fg)]">
                      {t(`tradition.${o.traditions[0]!}`)}
                    </span>
                  </button>
                </li>
              )),
            )}
          </ul>
        )}
      </section>

      <p className="text-small text-text-muted">{t("cal.listNote")}</p>
    </div>
  );
}

function DayPanchang({ date, city, citySet }: { date: LocalDateKey; city: ReturnType<typeof useLocalDay>["city"]; citySet: boolean }) {
  const { t, locale } = useI18n();
  let p: PanchangDay | null = null;
  try {
    p = panchangForDay(date, city);
  } catch {
    p = null;
  }
  if (!p) return <p className="text-text-muted">{t("cal.day.panchangOff")}</p>;
  const time = (ms: number | null) => formatTime(ms, locale, city.tz);
  const masa = t(masaKey(p.masa.index));
  const rows: [string, string, string?][] = [
    [t("cal.day.tithi"), t(tithiKey(p.tithi.index)), t("today.panchang.until", { time: time(p.tithi.endsAt) })],
    [t("cal.day.paksha"), t(`paksha.${p.tithi.paksha}`)],
    [t("cal.day.nakshatra"), t(nakshatraKey(p.nakshatra.index)), t("today.panchang.until", { time: time(p.nakshatra.endsAt) })],
    [t("cal.day.masa"), p.masa.adhik ? t("masa.adhik", { masa }) : masa],
    [t("cal.day.sunrise"), time(p.sunrise)],
    [t("cal.day.sunset"), time(p.sunset)],
  ];
  return (
    <div className="rounded-lg border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-4">
      <h3 className="text-h3">{t("cal.day.panchangFor", { city: city.name })}</h3>
      <dl className="mt-2">
        {rows.map(([k, v, sub]) => (
          <div key={k} className="flex justify-between gap-3 border-t border-divider py-2 first:border-t-0">
            <dt>{k}</dt>
            <dd className="text-right font-semibold">
              {v}
              {sub && <span className="block text-small font-normal text-text-muted">{sub}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-small text-text-muted">{t("today.panchang.indicative")}</p>
      <details className="mt-1 text-small">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-primary underline underline-offset-2">{t("today.panchang.howTitle")}</summary>
        <p className="text-text-muted">{t("today.panchang.howBody")}</p>
      </details>
      <Link href={routes.settings(locale)} className="inline-flex min-h-11 items-center text-small text-primary underline underline-offset-2">
        {citySet ? t("today.panchang.city", { city: city.name }) : t("today.panchang.defaultCity")}
      </Link>
    </div>
  );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border-input px-3 text-small aria-pressed:border-primary aria-pressed:bg-primary-tint aria-pressed:text-primary"
    >
      {pressed && (
        <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8.5l3 3 7-7" />
        </svg>
      )}
      {children}
    </button>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-6 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

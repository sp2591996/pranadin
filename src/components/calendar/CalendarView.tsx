"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Observance } from "@/content/load";
import { ObservanceBody, ObservanceName } from "@/components/ObservanceBody";
import { useLocalDay } from "@/components/useLocalDay";
import { cityName } from "@/lib/cities";
import { useI18n } from "@/i18n/client";
import { formatDateKey, formatTime } from "@/i18n/format";
import { masaKey, nakshatraKey, tithiKey } from "@/i18n/keys";
import { inWindow, observancesOn, upcoming } from "@/lib/observances";
import { panchangForDay } from "@/lib/panchang";
import { routes } from "@/lib/routes";
import type { LocalDateKey, PanchangDay } from "@/lib/types";
import { FestivalGuideEntry, FestivalLink, type FestivalLinkData } from "@/features/festivals/FestivalLinks";
import { monthGrid, monthOf, shiftMonth, type MonthKey } from "./month";
import { SectionHeader } from "@/components/SectionHeader";
import { Mandala } from "@/components/Mandala";

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
  festivals,
}: {
  observances: Observance[];
  window: { from: string; to: string };
  traditions: Tradition[];
  buildDate: string;
  festivals?: FestivalLinkData;
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

  // Moon days for the visible grid (indicative, for the user's city).
  const moons = useMemo(() => {
    const out = new Map<LocalDateKey, number>();
    if (!day.live) return out;
    for (const d of weeks.flat()) {
      try {
        out.set(d, panchangForDay(d, day.city).tithi.index);
      } catch {
        /* outside the supported range */
      }
    }
    return out;
  }, [weeks, day.live, day.city]);
  const monthCount = new Set(
    weeks
      .flat()
      .filter((d) => monthOf(d) === month)
      .flatMap((d) => observancesOn(shown, d).map((o) => o.id)),
  ).size;
  const selMoon = moons.get(selected);
  const color = (tr: string) => TRAD_COLOR[tr] ?? TRAD_COLOR.national;

  return (
    <div className="wide flex flex-col gap-6">
      <SectionHeader deva="पंचांग" title={t("cal.title")} intro={t("cal.intro")} />

      <FestivalGuideEntry data={festivals} />

      <div
        role="group"
        aria-label={t("cal.filter.label")}
        className="no-scrollbar relative -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        <Chip pressed={filter.length === 0} onClick={() => setFilter([])}>
          {t("cal.filter.all")}
        </Chip>
        {traditions.map((tr) => (
          <Chip key={tr} pressed={filter.includes(tr)} onClick={() => toggle(tr)}>
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color(tr) }} />
            {t(`tradition.${tr}`)}
          </Chip>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="cal-month"
          className="min-w-0 overflow-hidden rounded-[var(--r-xl)] border border-divider bg-surface shadow-elev-1 lg:col-span-7"
        >
          <div className="brand-earth brand-glow relative isolate flex items-center justify-between gap-2 overflow-hidden px-3 py-4 text-white sm:px-5">
            <Mandala className="slow-spin absolute -right-16 -top-24 -z-10 h-[260px] w-[260px] text-[#F3C35B] opacity-20" />
            <button
              type="button"
              onClick={() => go(-1)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label={t("cal.prev")}
            >
              <Chevron dir="left" />
            </button>
            <div className="min-w-0 text-center">
              <h2
                className="font-display text-[1.75rem] font-semibold leading-tight text-white sm:text-[2rem]"
                aria-live="polite"
                id="cal-month"
              >
                {monthTitle}
              </h2>
              <p className="text-small text-[#F3E4CC]">{t("cal.monthCount", { count: monthCount })}</p>
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label={t("cal.next")}
            >
              <Chevron dir="right" />
            </button>
          </div>

          <div className="p-2 sm:p-4">
            <table className="w-full table-fixed border-separate border-spacing-1 text-center" aria-labelledby="cal-month">
              <thead>
                <tr>
                  {weekdayNames.map((w) => (
                    <th key={w.long} scope="col" className="pb-1 text-caption font-semibold text-text-muted">
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
                      const items = observancesOn(shown, d);
                      const n = items.length;
                      const isToday = day.live && d === today;
                      const isSel = d === selected;
                      const moon = moons.get(d);
                      const special = moon !== undefined && MOON_DAYS.includes(moon);
                      const label = `${formatDateKey(d, locale, { weekday: "long", day: "numeric", month: "long" })}${
                        special ? `, ${t(tithiKey(moon))}` : ""
                      }${n ? `, ${t("cal.day.observances")}: ${n}` : ""}`;
                      const look = isToday
                        ? "brand-saffron text-white shadow-elev-1"
                        : isSel
                          ? "bg-primary-tint text-on-primary-tint ring-2 ring-primary ring-inset"
                          : n
                            ? "bg-[#F6DDB8] text-[#2B1A10] hover:bg-primary-tint hover:text-on-primary-tint"
                            : inMonth
                              ? "bg-[#F6EFE4] text-[#2B1A10] hover:bg-primary-tint hover:text-on-primary-tint"
                              : "text-text-muted hover:bg-surface-2";
                      return (
                        <td key={d} className="p-0 align-top">
                          <button
                            type="button"
                            onClick={() => select(d)}
                            aria-label={label}
                            aria-pressed={isSel}
                            aria-current={isToday ? "date" : undefined}
                            className={`relative flex h-14 w-full flex-col items-start justify-between overflow-hidden rounded-xl p-1.5 text-left transition-colors sm:h-20 sm:p-2 ${look}`}
                          >
                            <span className="flex w-full items-start justify-between gap-0.5">
                              <span className="text-small font-bold leading-none sm:text-body">{Number(d.slice(8))}</span>
                              {special && <Moon index={moon} size={14} />}
                            </span>
                            {n > 0 && (
                              <span aria-hidden className="flex w-full min-w-0 items-center gap-0.5">
                                {items.slice(0, 3).map((o) => (
                                  <span
                                    key={o.id}
                                    className="size-1.5 shrink-0 rounded-full ring-1 ring-white/70 sm:size-2"
                                    style={{ background: color(o.traditions[0]!) }}
                                  />
                                ))}
                                <span className="ml-0.5 hidden min-w-0 truncate text-small leading-tight sm:block">
                                  <ObservanceName o={items[0]!} />
                                </span>
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-small text-text-muted">
              <span className="font-semibold">{t("cal.legend")}:</span>
              <span className="inline-flex items-center gap-1">
                <Moon index={14} size={16} />
                {t("cal.legend.full")}
              </span>
              <span className="inline-flex items-center gap-1">
                <Moon index={29} size={16} />
                {t("cal.legend.new")}
              </span>
              <span className="inline-flex items-center gap-1">
                <Moon index={10} size={16} />
                {t("cal.legend.ekadashi")}
              </span>
            </p>
          </div>
        </section>

        <section aria-labelledby="day-title" className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-24 lg:col-span-5">
          <div className="flex items-center gap-4 rounded-[var(--r-xl)] border border-divider bg-primary-tint p-4 text-on-primary-tint">
            <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface shadow-elev-1">
              <span className="text-caption font-semibold text-primary">{formatDateKey(selected, locale, { month: "short" })}</span>
              <span className="font-display text-[1.75rem] font-bold leading-none">{Number(selected.slice(8))}</span>
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="day-title" className="font-display text-[1.375rem] font-semibold leading-tight">
                {formatDateKey(selected, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h2>
              {selMoon !== undefined && (
                <p className="text-small text-text-muted">{t("cal.moonLabel", { tithi: t(tithiKey(selMoon)) })}</p>
              )}
            </div>
            {selMoon !== undefined && <Moon index={selMoon} size={44} />}
          </div>
          {day.live ? (
            <DayPanchang date={selected} city={day.city} citySet={day.citySet} />
          ) : (
            <div className="min-h-[280px]" aria-busy="true" />
          )}

          <h3 className="text-h3">{t("cal.day.observances")}</h3>
          {dayItems.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {dayItems.map((o) => (
                <li
                  key={o.id}
                  className="rounded-2xl border border-l-4 border-divider bg-[var(--card-bg)] p-4 shadow-elev-1"
                  style={{ borderLeftColor: color(o.traditions[0]!) }}
                >
                  <p className="text-h3">
                    <ObservanceName o={o} />
                  </p>
                  <ObservanceBody o={o} />
                  <FestivalLink obsId={o.id} data={festivals} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border-2 border-dashed border-divider p-4 text-text-muted">
              {after ? t("cal.outOfRange") : t("cal.none")}
            </p>
          )}
        </section>
      </div>

      <section aria-labelledby="next7-title">
        <h2 id="next7-title" className="mb-3 font-display text-[1.625rem] font-semibold">
          {t("cal.next7")}
        </h2>
        {!(inWindow(window, today) || today < window.from) ? (
          <p className="text-text-muted">{t("cal.outOfRange")}</p>
        ) : next.length === 0 ? (
          <p className="text-text-muted">{t("cal.noneWeek")}</p>
        ) : (
          <ul className="no-scrollbar relative -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {next.flatMap((g) =>
              g.items.map((o) => (
                <li key={o.id} className="w-56 shrink-0 snap-start sm:w-auto">
                  <button
                    type="button"
                    onClick={() => select(g.date)}
                    className="flex h-full min-h-14 w-full items-start gap-3 rounded-2xl border border-divider bg-surface p-3 text-left shadow-elev-1 transition-transform hover:-translate-y-0.5"
                  >
                    <span
                      className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl text-white"
                      style={{ background: color(o.traditions[0]!) }}
                    >
                      <span className="text-small font-semibold leading-none">
                        {formatDateKey(g.date, locale, { weekday: "short" })}
                      </span>
                      <span className="font-display text-[1.375rem] font-bold leading-none">{Number(g.date.slice(8))}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        <ObservanceName o={o} />
                      </span>
                      <span className="block text-small text-text-muted">{t(`tradition.${o.traditions[0]!}`)}</span>
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

/** Purnima, Amavasya and both Ekadashis (tithi index 0..29). */
const MOON_DAYS = [14, 29, 10, 25];
/** Tradition colours for dots and date badges (white text passes 4.5:1 on each). */
const TRAD_COLOR: Record<string, string> = {
  hindu: "#B4500F",
  sikh: "#1D4F91",
  jain: "#7A5000",
  buddhist: "#7B3FB0",
  christian: "#A31C1C",
  islamic: "#14683A",
  jewish: "#0B5D73",
  parsi: "#A0174F",
  national: "#475569",
};

/** Moon phase drawn from the tithi: waxing lit on the right, waning on the left. */
function Moon({ index, size }: { index: number; size: number }) {
  const waxing = index < 15;
  const f = waxing ? (index + 1) / 15 : (29 - index) / 15;
  const r = size / 2 - 1;
  const c = size / 2;
  const rx = r * Math.abs(1 - 2 * f);
  const outer = waxing ? 1 : 0;
  const inner = waxing ? (f > 0.5 ? 1 : 0) : f > 0.5 ? 0 : 1;
  return (
    <svg aria-hidden viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
      <circle cx={c} cy={c} r={r} fill="#3B2A1E" stroke="#F3C35B" strokeWidth="1" />
      {f > 0 && (
        <path d={`M${c} ${c - r} A${r} ${r} 0 0 ${outer} ${c} ${c + r} A${rx} ${r} 0 0 ${inner} ${c} ${c - r}Z`} fill="#F8D57E" />
      )}
    </svg>
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
    <div className="rounded-2xl border border-divider shadow-elev-1 bg-[var(--card-bg)] p-4">
      <h3 className="text-h3">{t("cal.day.panchangFor", { city: cityName(city, locale) })}</h3>
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
        {citySet ? t("today.panchang.city", { city: cityName(city, locale) }) : t("today.panchang.defaultCity")}
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

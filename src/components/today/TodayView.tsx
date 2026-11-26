"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Observance } from "@/content/load";
import { Mandala } from "@/components/Mandala";
import { Ornament } from "@/components/Ornaments";
import { EnglishMark, ObservanceBody, ObservanceName } from "@/components/ObservanceBody";
import { useLocalDay } from "@/components/useLocalDay";
import { cityName } from "@/lib/cities";
import { useI18n } from "@/i18n/client";
import { formatDateKey, formatTime } from "@/i18n/format";
import { nakshatraKey, tithiKey, type MessageKey } from "@/i18n/keys";
import { inWindow, observancesOn, upcoming } from "@/lib/observances";
import { panchangForDay } from "@/lib/panchang";
import { FestivalLink, type FestivalLinkData } from "@/features/festivals/FestivalLinks";
import { routes } from "@/lib/routes";

/**
 * Greeting by local hour (QA-20). Late night uses the neutral greeting
 * (`today.greeting.afternoon` = "Namaste"), never "Good evening" at 2 am.
 */
export function greetingKey(hour: number): MessageKey {
  if (hour >= 4 && hour < 12) return "today.greeting.morning";
  if (hour >= 17 && hour < 22) return "today.greeting.evening";
  return "today.greeting.afternoon";
}

/**
 * Today (E-06, Dev-1). The static HTML carries the observance list for the
 * build date, so content paints before JavaScript runs (QA-09); the device
 * then switches to its own date and city. The panchang card is computed only
 * on the device (it depends on the real day and city); its space is reserved
 * to avoid layout shift. The 3-step plan (FR-3.2) slots in below the panchang.
 */
export function TodayView({
  observances,
  window,
  buildDate,
  plan,
  verse,
  festivals,
  explore,
}: {
  observances: Observance[];
  window: { from: string; to: string };
  buildDate: string;
  /** Dev-2's 3-step plan (CR-D2-08, FR-3.2), rendered under the panchang card. */
  plan?: React.ReactNode;
  /** Verse of the day (D-026 Wave C), rendered under the plan. */
  verse?: React.ReactNode;
  /** Festival guide links (D-026 Wave D). */
  festivals?: FestivalLinkData;
  /** "Explore" card grid into Yoga, Japa, Festivals, Yatra, Chakras (D-033). */
  explore?: React.ReactNode;
}) {
  const { t, locale } = useI18n();
  const day = useLocalDay(buildDate);
  const { city, dateKey } = day;
  const p = useMemo(() => (day.live ? panchangForDay(dateKey, city) : null), [day.live, dateKey, city]);
  const time = (ms: number | null) => formatTime(ms, locale, city.tz);
  const todays = observancesOn(observances, dateKey);
  const next = upcoming(observances, dateKey, 7);
  // Only "after the checked window" is a gap; before it starts, upcoming items still show.
  const covered = inWindow(window, dateKey) || dateKey < window.from;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="greeting" className="hero-dark relative isolate overflow-hidden rounded-[var(--r-xl)] px-6 py-10 text-center shadow-elev-3 sm:py-14">
        <Mandala className="slow-spin absolute -left-24 -top-24 -z-10 h-72 w-72 text-[#F3C35B] opacity-[0.12]" />
        <Mandala className="slow-spin absolute -bottom-28 right-0 -z-10 h-72 w-72 text-[#F3C35B] opacity-[0.10]" />
        <p aria-hidden="true" className="gentle-float font-deva text-6xl leading-none text-[#F3C35B] drop-shadow-[0_4px_18px_rgba(243,195,91,0.35)]">
          ॐ
        </p>
        <p className="eyebrow mt-5 text-[#E9CF97]">{t("today.hero.eyebrow")}</p>
        <h1 id="greeting" className="mt-2 text-display text-[#FDF3E1] sm:text-[3.5rem] sm:leading-[1.1]">
          {day.hour === null ? t("common.today") : t(greetingKey(day.hour))}
        </h1>
        <p className="min-h-6 text-[#E9CF97]">{day.live ? formatDateKey(dateKey, locale) : ""}</p>
        <p className="mx-auto mt-3 max-w-md font-display text-[1.375rem] italic leading-snug text-[#F5DDA8]">{t("today.hero.sub")}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href={routes.practice(locale)} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#F2B640] px-7 font-semibold text-[#35180A] shadow-[0_8px_24px_-8px_rgba(242,182,64,0.7)] hover:bg-[#F6C55E]">
            {t("today.hero.cta")}
          </Link>
          <Link href={routes.sounds(locale)} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F5DDA8]/40 px-6 font-semibold text-[#FDF3E1] hover:bg-white/10">
            {t("today.hero.sounds")}
          </Link>
        </div>
      </section>

      {todays.map((o) => (
        <section key={o.id} aria-labelledby={`obs-${o.id}`} className="paper-texture relative isolate overflow-hidden rounded-[var(--r-xl)] border border-[color-mix(in_srgb,var(--accent)_45%,var(--divider))] bg-surface p-5 shadow-elev-1 sm:p-7">
          <Mandala className="absolute -bottom-12 -right-12 -z-10 h-44 w-44 text-[var(--accent)] opacity-20" />
          <p id={`obs-${o.id}`} className="font-display text-h2 text-primary">
            {t("today.observance.banner", { name: o.name })}
            {o.lang === "en" && <EnglishMark />}
          </p>
          <ObservanceBody o={o} />
          <FestivalLink obsId={o.id} data={festivals} />
        </section>
      ))}

      <section
        aria-labelledby="panchang-title"
        aria-busy={!p}
        className="saffron-wash min-h-[248px] rounded-[var(--r-xl)] border border-[color-mix(in_srgb,var(--primary)_22%,var(--divider))] p-5 shadow-elev-1 sm:p-6"
      >
        <h2 id="panchang-title" className="sr-only">
          {t("cal.day.panchangFor", { city: cityName(city, locale) })}
        </h2>
        <p aria-hidden="true" className="eyebrow mb-3 text-primary">
          <span className="font-deva tracking-normal">पंचांग</span>
        </p>
        {p && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 rounded-2xl border border-divider bg-surface/80 p-4 sm:col-span-1">
                <p className="font-display text-h3 font-semibold">
                  {t("today.panchang.tithi", { tithi: t(tithiKey(p.tithi.index)) })} · {t(`paksha.${p.tithi.paksha}`)}
                </p>
                <p className="text-small text-text-muted">{t("today.panchang.until", { time: time(p.tithi.endsAt) })}</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-divider bg-surface/80 p-4 sm:col-span-1">
                <p className="font-display text-h3 font-semibold">
                  {t("today.panchang.nakshatra", { nakshatra: t(nakshatraKey(p.nakshatra.index)) })}
                </p>
                <p className="text-small text-text-muted">{t("today.panchang.until", { time: time(p.nakshatra.endsAt) })}</p>
              </div>
              <p className="flex items-center gap-2 rounded-2xl border border-divider bg-surface/80 p-3 text-small">
                <Ornament name="sun" className="h-5 w-5 shrink-0 text-accent" />
                <span>{t("today.panchang.sunrise", { time: time(p.sunrise) })}</span>
              </p>
              <p className="flex items-center gap-2 rounded-2xl border border-divider bg-surface/80 p-3 text-small">
                <Ornament name="diya" className="h-5 w-5 shrink-0 text-accent" />
                <span>{t("today.panchang.sunset", { time: time(p.sunset) })}</span>
              </p>
            </div>
            <p className="mt-3 text-small text-text-muted">{t("today.panchang.indicative")}</p>
            <p className="mt-1 flex flex-wrap gap-x-4 text-small">
              <Link href={routes.settings(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
                {day.citySet ? t("today.panchang.city", { city: cityName(city, locale) }) : t("today.panchang.defaultCity")}
              </Link>
              <Link href={routes.calendar(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
                {t("cal.title")}
              </Link>
            </p>
            {!day.citySet && <p className="text-small text-text-muted">{t("today.panchang.setCity")}</p>}
          </>
        )}
      </section>

      {plan}

      {verse}

      {explore}

      <section aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className="mb-2">
          {t("today.observance.upcoming")}
        </h2>
        {!covered ? (
          <p className="relative isolate overflow-hidden rounded-2xl border border-dashed border-divider p-4 text-text-muted"><Mandala className="absolute -right-8 -top-8 -z-10 h-28 w-28 text-[var(--accent)] opacity-30" />{t("cal.outOfRange")}</p>
        ) : next.length === 0 ? (
          <p className="relative isolate overflow-hidden rounded-2xl border border-dashed border-divider p-4 text-text-muted"><Mandala className="absolute -right-8 -top-8 -z-10 h-28 w-28 text-[var(--accent)] opacity-30" />{t("cal.noneWeek")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {next.flatMap((g) =>
              g.items.map((o) => (
                <li key={o.id} className="rounded-2xl border border-divider bg-surface p-4 shadow-elev-1">
                  <p className="text-small text-text-muted">
                    {formatDateKey(g.date, locale, { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <p className="text-h3">
                    <ObservanceName o={o} />
                  </p>
                  <ObservanceBody o={o} />
                  <FestivalLink obsId={o.id} data={festivals} />
                </li>
              )),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

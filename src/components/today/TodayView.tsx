"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Observance } from "@/content/load";
import { useI18n } from "@/i18n/client";
import { formatDateKey, formatTime, localDateKey, localHour } from "@/i18n/format";
import { nakshatraKey, tithiKey, type MessageKey } from "@/i18n/keys";
import { getCity, type City } from "@/lib/cities";
import { inWindow, observancesOn, upcoming } from "@/lib/observances";
import { panchangForDay } from "@/lib/panchang";
import { routes } from "@/lib/routes";
import { getPrefs } from "@/lib/storage";
import type { PanchangDay } from "@/lib/types";

interface TodayState {
  city: City;
  citySet: boolean;
  dateKey: string;
  hour: number;
  panchang: PanchangDay;
}

function greetingKey(hour: number): MessageKey {
  if (hour >= 4 && hour < 12) return "today.greeting.morning";
  if (hour >= 12 && hour < 17) return "today.greeting.afternoon";
  return "today.greeting.evening";
}

function compute(): TodayState {
  const prefs = getPrefs().read();
  const city = getCity(prefs.cityId);
  const now = Date.now();
  const dateKey = localDateKey(now, city.tz);
  return { city, citySet: prefs.cityId !== null, dateKey, hour: localHour(now, city.tz), panchang: panchangForDay(dateKey, city) };
}

/**
 * Today (E-06, Dev-1). Computed on the device, because the static HTML is
 * built once and "today" depends on the clock and the chosen city.
 * Recomputes when the tab becomes visible again, so the day rolls over at
 * local midnight (FR-3.5). The 3-step plan (FR-3.2) slots in below the
 * panchang; see CONTRACTS.md.
 */
export function TodayView({ observances, window }: { observances: Observance[]; window: { from: string; to: string } }) {
  const { t, locale } = useI18n();
  const [state, setState] = useState<TodayState | null>(null);

  useEffect(() => {
    const update = () => setState(compute());
    update();
    const onVis = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!state) {
    // Reserve space to avoid layout shift (CLS budget).
    return <div aria-busy="true" className="min-h-[320px]" />;
  }

  const { panchang: p, city, dateKey } = state;
  const time = (ms: number | null) => formatTime(ms, locale, city.tz);
  const todays = observancesOn(observances, dateKey);
  const next = upcoming(observances, dateKey, 7);
  // Only "after the checked window" is a gap; before it starts, upcoming items still show.
  const covered = inWindow(window, dateKey) || dateKey < window.from;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="greeting">
        <h1 id="greeting">{t(greetingKey(state.hour))}</h1>
        <p className="text-text-muted">{formatDateKey(dateKey, locale)}</p>
      </section>

      {todays.map((o) => (
        <section
          key={o.id}
          aria-label={t("today.observance.banner", { name: o.name })}
          className="rounded-lg bg-[var(--card-hero-bg)] p-4"
          lang={o.lang}
        >
          <p className="text-h3">{t("today.observance.banner", { name: o.name })}</p>
          <ObservanceBody o={o} />
        </section>
      ))}

      <section aria-labelledby="panchang-title" className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
        <h2 id="panchang-title" className="sr-only">
          {t("cal.day.panchangFor", { city: city.name })}
        </h2>
        <p className="text-h3">
          {t("today.panchang.tithi", { tithi: t(tithiKey(p.tithi.index)) })} · {t(`paksha.${p.tithi.paksha}`)}
        </p>
        <p className="text-small text-text-muted">{t("today.panchang.until", { time: time(p.tithi.endsAt) })}</p>
        <p className="mt-2">
          {t("today.panchang.nakshatra", { nakshatra: t(nakshatraKey(p.nakshatra.index)) })}
          <span className="text-text-muted"> · {t("today.panchang.until", { time: time(p.nakshatra.endsAt) })}</span>
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4">
          <span>{t("today.panchang.sunrise", { time: time(p.sunrise) })}</span>
          <span>{t("today.panchang.sunset", { time: time(p.sunset) })}</span>
        </p>
        <p className="mt-3 text-small text-text-muted">{t("today.panchang.indicative")}</p>
        <p className="mt-1 text-small">
          <Link href={routes.settings(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
            {state.citySet ? t("today.panchang.city", { city: city.name }) : t("today.panchang.defaultCity")}
          </Link>
        </p>
        {!state.citySet && <p className="text-small text-text-muted">{t("today.panchang.setCity")}</p>}
      </section>

      <section aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className="mb-2">
          {t("today.observance.upcoming")}
        </h2>
        {!covered ? (
          <p className="text-text-muted">{t("cal.outOfRange")}</p>
        ) : next.length === 0 ? (
          <p className="text-text-muted">{t("cal.noneWeek")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {next.flatMap((g) =>
              g.items.map((o) => (
                <li key={o.id} className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4" lang={o.lang}>
                  <p className="text-small text-text-muted" lang={locale}>
                    {formatDateKey(g.date, locale, { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <p className="text-h3">{o.name}</p>
                  <ObservanceBody o={o} />
                </li>
              )),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function ObservanceBody({ o }: { o: Observance }) {
  const { t, locale } = useI18n();
  return (
    <>
      <ul className="mt-1 flex flex-wrap gap-2" aria-label={t("cal.filter.label")} lang={locale}>
        {o.traditions.map((tr) => (
          <li
            key={tr}
            className="rounded-full bg-[var(--tradition-tag-bg)] px-2 text-caption text-[var(--tradition-tag-fg)]"
          >
            {t(`tradition.${tr}`)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-small" lang={o.noteLang}>
        {o.note}
      </p>
      {o.flagKeys.map((k) => (
        <p key={k} className="mt-1 text-small text-text-muted" lang={locale}>
          {t(k as MessageKey)}
        </p>
      ))}
      {o.endDate && (
        <p className="mt-1 text-small text-text-muted" lang={locale}>
          {t("cal.obs.range", {
            start: formatDateKey(o.date, locale, { day: "numeric", month: "short" }),
            end: formatDateKey(o.endDate, locale, { day: "numeric", month: "short" }),
          })}
        </p>
      )}
    </>
  );
}

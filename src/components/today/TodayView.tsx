"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/catalog";
import { formatDateKey, formatTime, localDateKey, localHour } from "@/i18n/format";
import { getCity, type City } from "@/lib/cities";
import { panchangForDay, MASA_NAMES_EN, NAKSHATRA_NAMES_EN, tithiNameEn } from "@/lib/panchang";
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
  if (hour >= 17 && hour < 21) return "today.greeting.evening";
  return "today.greeting.night";
}

function compute(): TodayState {
  const prefs = getPrefs().read();
  const city = getCity(prefs.cityId);
  const now = Date.now();
  const dateKey = localDateKey(now, city.tz);
  return { city, citySet: prefs.cityId !== null, dateKey, hour: localHour(now, city.tz), panchang: panchangForDay(dateKey, city) };
}

/**
 * Today (E-06 owner: Dev-1). Computed on the device, because the static HTML
 * is built once and "today" depends on the clock and the chosen city.
 * Recomputes when the tab becomes visible again, so the day rolls over at
 * local midnight (FR-3.5).
 */
export function TodayView() {
  const { t, locale } = useI18n();
  const [state, setState] = useState<TodayState | null>(null);

  useEffect(() => {
    const update = () => setState(compute());
    update();
    const onVis = () => document.visibilityState === "visible" && update();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!state) {
    // Reserve space to avoid layout shift (CLS budget).
    return <div aria-busy="true" className="min-h-[220px]" />;
  }

  const { panchang: p, city } = state;
  const tz = city.tz;
  const time = (ms: number | null) => formatTime(ms, locale, tz);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="greeting">
        <h1 id="greeting">{t(greetingKey(state.hour))}</h1>
        <p className="text-text-muted">{formatDateKey(state.dateKey, locale)}</p>
      </section>

      <section aria-labelledby="panchang-title" className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
        <h2 id="panchang-title" className="sr-only">
          {t("panchang.tithi")}
        </h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="col-span-2">
            <dt className="text-[14px] leading-5 text-text-muted">{t("panchang.tithi")}</dt>
            <dd className="text-[18px] leading-7 font-semibold">
              <span lang="en">{tithiNameEn(p.tithi.index)}</span>
              {" · "}
              {t(`panchang.paksha.${p.tithi.paksha}`)}
              <span className="block text-[14px] leading-5 font-normal text-text-muted">
                {t("panchang.until", { time: time(p.tithi.endsAt) })}
              </span>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[14px] leading-5 text-text-muted">{t("panchang.nakshatra")}</dt>
            <dd>
              <span lang="en">{NAKSHATRA_NAMES_EN[p.nakshatra.index]}</span>
              <span className="text-text-muted"> · {t("panchang.until", { time: time(p.nakshatra.endsAt) })}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[14px] leading-5 text-text-muted">{t("panchang.sunrise")}</dt>
            <dd>{time(p.sunrise)}</dd>
          </div>
          <div>
            <dt className="text-[14px] leading-5 text-text-muted">{t("panchang.sunset")}</dt>
            <dd>{time(p.sunset)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[14px] leading-5 text-text-muted">
          <span lang="en">
            {p.masa.adhik ? `${t("panchang.adhik")} ` : ""}
            {MASA_NAMES_EN[p.masa.index]}
          </span>
          {" · "}
          {t("panchang.indicative")}
        </p>
        <p className="mt-1 text-[14px] leading-5">
          {state.citySet ? (
            <span className="text-text-muted">{city.name}</span>
          ) : (
            <Link href={routes.settings(locale)} className="text-primary underline underline-offset-2">
              {t("panchang.defaultCity", { city: city.name })}
            </Link>
          )}
        </p>
      </section>
    </div>
  );
}

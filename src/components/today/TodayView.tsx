"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Observance } from "@/content/load";
import { EnglishMark, ObservanceBody, ObservanceName } from "@/components/ObservanceBody";
import { useLocalDay } from "@/components/useLocalDay";
import { useI18n } from "@/i18n/client";
import { formatDateKey, formatTime } from "@/i18n/format";
import { nakshatraKey, tithiKey, type MessageKey } from "@/i18n/keys";
import { inWindow, observancesOn, upcoming } from "@/lib/observances";
import { panchangForDay } from "@/lib/panchang";
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
}: {
  observances: Observance[];
  window: { from: string; to: string };
  buildDate: string;
  /** Dev-2's 3-step plan (CR-D2-08, FR-3.2), rendered under the panchang card. */
  plan?: React.ReactNode;
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
      <section aria-labelledby="greeting">
        <h1 id="greeting">{day.hour === null ? t("common.today") : t(greetingKey(day.hour))}</h1>
        <p className="min-h-6 text-text-muted">{day.live ? formatDateKey(dateKey, locale) : ""}</p>
      </section>

      {todays.map((o) => (
        <section key={o.id} aria-labelledby={`obs-${o.id}`} className="rounded-lg bg-[var(--card-hero-bg)] p-4">
          <p id={`obs-${o.id}`} className="text-h3">
            {t("today.observance.banner", { name: o.name })}
            {o.lang === "en" && <EnglishMark />}
          </p>
          <ObservanceBody o={o} />
        </section>
      ))}

      <section
        aria-labelledby="panchang-title"
        aria-busy={!p}
        className="min-h-[248px] rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
      >
        <h2 id="panchang-title" className="sr-only">
          {t("cal.day.panchangFor", { city: city.name })}
        </h2>
        {p && (
          <>
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
            <p className="mt-1 flex flex-wrap gap-x-4 text-small">
              <Link href={routes.settings(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
                {day.citySet ? t("today.panchang.city", { city: city.name }) : t("today.panchang.defaultCity")}
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
                <li key={o.id} className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                  <p className="text-small text-text-muted">
                    {formatDateKey(g.date, locale, { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <p className="text-h3">
                    <ObservanceName o={o} />
                  </p>
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

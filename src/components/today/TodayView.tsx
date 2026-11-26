"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Observance } from "@/content/load";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/icons.generated";
import { Mandala } from "@/components/Mandala";
import { EnglishMark, ObservanceBody, ObservanceName } from "@/components/ObservanceBody";
import { useLocalDay } from "@/components/useLocalDay";
import { cityName } from "@/lib/cities";
import { useI18n } from "@/i18n/client";
import { formatDateKey, formatTime } from "@/i18n/format";
import { nakshatraKey, tithiKey, type MessageKey } from "@/i18n/keys";
import { inWindow, observancesOn, upcoming } from "@/lib/observances";
import { panchangForDay } from "@/lib/panchang";
import { FestivalLink, type FestivalLinkData } from "@/features/festivals/FestivalLinks";
import { loadProgress } from "@/features/practice/store";
import type { Progress } from "@/features/practice/streak";
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

function Tile({ icon, label, value, sub, accent }: { icon: IconName; label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3.5 ${accent ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--divider))] bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))]" : "border-divider bg-surface/80"}`}>
      <p className="eyebrow flex items-center gap-1.5 !tracking-wider text-primary">
        <Icon name={icon} size={14} />
        {label}
      </p>
      <p className="mt-1.5 font-semibold leading-snug text-text">{value}</p>
      {sub && <p className="mt-0.5 text-small text-text-muted">{sub}</p>}
    </div>
  );
}

function Stat({ icon, value, label, sub }: { icon: IconName; value: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-divider bg-surface p-5 shadow-elev-1">
      <span aria-hidden="true" className="text-primary">
        <Icon name={icon} size={22} />
      </span>
      <p className="mt-2 font-display text-[2.25rem] font-semibold leading-none text-text">{value}</p>
      <p className="mt-2 font-medium text-text">{label}</p>
      <p className="text-small text-text-muted">{sub}</p>
    </div>
  );
}

/**
 * Today (E-06, D-033 look after the reference prototype's home). The static
 * HTML carries the observance list for the build date, so content paints
 * before JavaScript runs (QA-09); the device then switches to its own date and
 * city. The panchang is computed only on the device; its space is reserved.
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
  /** Dev-2's 3-step plan (CR-D2-08, FR-3.2). */
  plan?: React.ReactNode;
  /** Verse of the day (D-026 Wave C). */
  verse?: React.ReactNode;
  /** Festival guide links (D-026 Wave D). */
  festivals?: FestivalLinkData;
  /** "Your path today" list into every section (D-033). */
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
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => {
    let alive = true;
    void loadProgress()
      .then((pr) => alive && setProgress(pr))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  const n = (x: number | undefined) => (progress ? new Intl.NumberFormat(locale === "en" ? "en-IN" : `${locale}-IN`).format(x ?? 0) : "–");

  return (
    <div className="wide flex flex-col gap-8">
      {/* ---------- HERO ---------- */}
      <section aria-labelledby="greeting" className="hero-dark relative isolate overflow-hidden rounded-[var(--r-xl)] px-6 py-12 text-center shadow-xl shadow-orange-950/20 sm:py-16">
        <Mandala className="slow-spin absolute -top-24 right-0 -z-10 h-[416px] w-[416px] text-[#F3C35B] opacity-[0.10]" />
        <Mandala className="slow-spin absolute -bottom-32 -left-24 -z-10 h-[320px] w-[320px] text-[#F3C35B] opacity-[0.07]" />
        <p aria-hidden="true" className="gentle-float font-deva text-6xl leading-none text-[#F3C35B] drop-shadow-[0_4px_18px_rgba(243,195,91,0.4)]">
          ॐ
        </p>
        <p className="eyebrow mt-6 !tracking-[0.3em] text-[#E9CF97]">{t("today.hero.eyebrow")}</p>
        <h1 id="greeting" className="mt-3 text-[2.75rem] font-semibold leading-[1.1] text-[#FDF3E1] sm:text-[4rem]">
          {day.hour === null ? t("common.today") : t(greetingKey(day.hour))}
        </h1>
        <p className="mt-2 font-display text-[1.5rem] italic text-[#F3C35B] sm:text-[1.75rem]">{t("today.hero.welcome")}</p>
        <p className="mt-1 min-h-6 text-small text-[#E9CF97]">{day.live ? formatDateKey(dateKey, locale) : ""}</p>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-[#EBD7AE]">{t("today.hero.sub")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={routes.practice(locale)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F5B22E] px-7 font-semibold text-[#35180A] shadow-lg shadow-amber-500/30 transition-colors hover:bg-[#F8C04D]">
            {t("today.hero.cta")}
            <Icon name="ArrowRight" size={18} />
          </Link>
          <Link href={routes.sounds(locale)} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F5DDA8]/40 px-7 font-semibold text-[#FDF3E1] transition-colors hover:bg-white/10">
            {t("today.hero.sounds")}
          </Link>
        </div>
      </section>

      {/* ---------- TODAY'S OBSERVANCE ---------- */}
      {todays.map((o) => (
        <section key={o.id} aria-labelledby={`obs-${o.id}`} className="paper-texture relative isolate mx-auto w-full max-w-3xl overflow-hidden rounded-[var(--r-xl)] border border-[color-mix(in_srgb,var(--accent)_45%,var(--divider))] bg-surface p-6 shadow-elev-1 sm:p-8">
          <Mandala className="absolute -bottom-12 right-0 -z-10 h-44 w-44 text-[var(--accent)] opacity-20" />
          <p id={`obs-${o.id}`} className="font-display text-h2 text-primary">
            {t("today.observance.banner", { name: o.name })}
            {o.lang === "en" && <EnglishMark />}
          </p>
          <ObservanceBody o={o} />
          <FestivalLink obsId={o.id} data={festivals} />
        </section>
      ))}

      {/* ---------- SHLOKA ---------- */}
      {verse && <div className="mx-auto w-full max-w-3xl">{verse}</div>}

      {/* ---------- PANCHANG STRIP ---------- */}
      <section
        aria-labelledby="panchang-title"
        aria-busy={!p}
        className="saffron-wash mx-auto min-h-[248px] w-full max-w-4xl rounded-[var(--r-xl)] border border-[color-mix(in_srgb,var(--primary)_20%,var(--divider))] p-5 shadow-elev-1 sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-tint text-primary">
              <Icon name="CalendarHeart" size={20} />
            </span>
            <div>
              <h2 id="panchang-title" className="text-[1.375rem] leading-7">
                {t("today.panchang.title")}
              </h2>
              <p className="text-small text-text-muted">{day.citySet ? cityName(city, locale) : t("today.panchang.defaultCity").split("·")[0]}</p>
            </div>
          </div>
          <Link href={routes.calendar(locale)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--primary)_35%,var(--divider))] px-4 text-small font-semibold text-primary hover:bg-primary-tint">
            {t("today.panchang.full")}
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
        {p && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile
                icon="SunDim"
                label={t(`paksha.${p.tithi.paksha}`)}
                value={t("today.panchang.tithi", { tithi: t(tithiKey(p.tithi.index)) })}
                sub={
                  <>
                    {t("today.panchang.until", { time: time(p.tithi.endsAt) })}
                    <br />
                    {t("today.panchang.nakshatra", { nakshatra: t(nakshatraKey(p.nakshatra.index)) })}
                  </>
                }
              />
              <Tile icon="Sun" label={t("today.tile.sunrise")} value={time(p.sunrise)} />
              <Tile icon="SunHorizon" label={t("today.tile.sunset")} value={time(p.sunset)} />
              <Tile icon="Sparkle" accent label={t("today.tile.sacred")} value={todays[0] ? todays[0].name : t("today.tile.quiet")} />
            </div>
            <p className="mt-4 text-small text-text-muted">{t("today.panchang.indicative")}</p>
            <p className="flex flex-wrap gap-x-4 text-small">
              <Link href={routes.settings(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
                {day.citySet ? t("today.panchang.city", { city: cityName(city, locale) }) : t("today.panchang.defaultCity")}
              </Link>
            </p>
            {!day.citySet && <p className="text-small text-text-muted">{t("today.panchang.setCity")}</p>}
          </>
        )}
      </section>

      {/* ---------- STATS ---------- */}
      <section aria-label={t("today.stat.streak")} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat icon="Flame" value={n(progress?.streak)} label={t("today.stat.streak")} sub={t("today.stat.streakSub")} />
        <Stat icon="Timer" value={n(progress?.totalMinutes)} label={t("today.stat.minutes")} sub={t("today.stat.minutesSub")} />
        <Stat icon="Sparkle" value={n(progress?.totalDays)} label={t("today.stat.days")} sub={t("today.stat.daysSub")} />
        <Stat
          icon="CheckCircle"
          value={
            <>
              {n(progress?.weekDays)}
              <span className="text-text-muted">/{n(7)}</span>
            </>
          }
          label={t("today.stat.week")}
          sub={t("today.stat.weekSub")}
        />
      </section>

      {/* ---------- PLAN + PATH ---------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>{plan}</div>
        <div>{explore}</div>
      </div>

      {/* ---------- UPCOMING ---------- */}
      <section aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className="mb-3 text-[1.75rem] leading-9">
          {t("today.observance.upcoming")}
        </h2>
        {!covered ? (
          <p className="rounded-2xl border border-dashed border-divider p-5 text-text-muted">{t("cal.outOfRange")}</p>
        ) : next.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-divider p-5 text-text-muted">{t("cal.noneWeek")}</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {next.flatMap((g) =>
              g.items.map((o) => (
                <li key={o.id} className="rounded-2xl border border-divider bg-surface p-5 shadow-elev-1">
                  <p className="eyebrow !tracking-wider text-primary">{formatDateKey(g.date, locale, { weekday: "short", day: "numeric", month: "short" })}</p>
                  <p className="mt-1 font-display text-[1.375rem] font-semibold leading-tight">
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

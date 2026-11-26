"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Observance } from "@/content/load";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/icons.generated";
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

/** Hero photo by time of day (D-036): dawn Rishikesh, day Amritsar, evening Varanasi, night Ujjain. */
export function heroPlace(hour: number | null): string {
  if (hour === null) return "varanasi";
  if (hour >= 4 && hour < 10) return "rishikesh";
  if (hour >= 10 && hour < 16) return "amritsar";
  if (hour >= 16 && hour < 20) return "varanasi";
  return "ujjain";
}

const daysBetween = (a: string, b: string) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86400000);

function Chip({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <span className="glass inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-small font-semibold text-[#fff]">
      <Icon name={icon} size={16} className="text-[#F5B22E]" />
      {children}
    </span>
  );
}

/** Sunrise-to-sunset arc with the sun where it is now. Decorative; the times are also written out. */
function SunArc({ frac }: { frac: number | null }) {
  const f = frac === null ? null : Math.min(1, Math.max(0, frac));
  const th = Math.PI * (1 - (f ?? 0));
  const x = 150 + 130 * Math.cos(th);
  const y = 140 - 130 * Math.sin(th);
  return (
    <svg viewBox="0 0 300 150" aria-hidden="true" className="h-auto w-full max-w-[22rem]">
      <defs>
        <linearGradient id="arc-g" x1="0" x2="1">
          <stop offset="0" stopColor="#F5B22E" />
          <stop offset="1" stopColor="#D2581F" />
        </linearGradient>
      </defs>
      <line x1="6" y1="140" x2="294" y2="140" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M20 140 A130 130 0 0 1 280 140" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="4 6" />
      {f !== null && f > 0 && <path d="M20 140 A130 130 0 0 1 280 140" fill="none" stroke="url(#arc-g)" strokeWidth="4" strokeLinecap="round" pathLength={100} strokeDasharray={`${f * 100} 100`} />}
      {f !== null && f > 0 && f < 1 && (
        <g className="sun-dot">
          <circle cx={x} cy={y} r="14" fill="#F5B22E" fillOpacity="0.25" />
          <circle cx={x} cy={y} r="8" fill="#F5B22E" />
        </g>
      )}
      <circle cx="20" cy="140" r="4" fill="#F5B22E" />
      <circle cx="280" cy="140" r="4" fill="#D2581F" />
    </svg>
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
  const pan = useMemo(() => (day.live ? panchangForDay(dateKey, city) : null), [day.live, dateKey, city]);
  // The sun moves along its arc; the device clock is read after load and once a minute (never in the static HTML).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 60000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  const p = pan && now !== null ? { ...pan, now } : null;
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

  const nextSacred = upcoming(observances, dateKey, 60)
    .filter((g) => g.date > dateKey)
    .flatMap((g) => g.items.map((o) => ({ date: g.date, o })))[0];
  const inDays = nextSacred ? daysBetween(dateKey, nextSacred.date) : 0;
  const sun = p && p.sunrise && p.sunset ? { rise: p.sunrise, set: p.sunset, now: p.now } : null;
  const frac = sun ? (sun.now - sun.rise) / (sun.set - sun.rise) : null;
  const left = (ms: number) => ({ h: Math.floor(ms / 3600000), m: Math.floor((ms % 3600000) / 60000) });
  const sunLine = !sun ? "" : sun.now < sun.rise ? t("today.sun.toSunrise", left(sun.rise - sun.now)) : sun.now < sun.set ? t("today.sun.toSunset", left(sun.set - sun.now)) : t("today.sun.set");
  const place = heroPlace(day.hour);

  return (
    <div className="wide flex flex-col gap-10 lg:gap-14">
      {/* ---------- HERO: a sacred place, chosen by the hour ---------- */}
      <section aria-labelledby="greeting" className="relative isolate -mx-4 overflow-hidden bg-[#2A1408] shadow-xl shadow-orange-950/25 sm:mx-0 sm:rounded-[var(--r-xl)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps Today inside the JS budget; files are pre-sized webp */}
        <img key={place} src={`/yatra/${place}/hero.webp`} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <span aria-hidden="true" className="photo-shade absolute inset-0 -z-10 lg:hidden" />
        <span aria-hidden="true" className="photo-shade-side absolute inset-0 -z-10 hidden lg:block" />
        <span className="glass absolute right-4 top-4 rounded-full px-2.5 py-1 text-caption text-[#fff]">{t("today.hero.aiPhoto")}</span>
        <div className="flex min-h-[34rem] flex-col justify-end px-6 pb-8 pt-20 sm:px-10 lg:min-h-[36rem] lg:max-w-2xl lg:justify-center lg:px-14 lg:py-16">
          <p aria-hidden="true" className="gentle-float font-deva text-5xl leading-none text-[#F3C35B] drop-shadow-[0_4px_18px_rgba(243,195,91,0.5)]">
            ॐ
          </p>
          <p className="eyebrow mt-5 !tracking-[0.25em] text-[#F3D9A4]">{t("today.hero.eyebrow")}</p>
          <h1 id="greeting" className="mt-2 text-[2.75rem] font-semibold leading-[1.05] text-[#fff] sm:text-[4.25rem]">
            {day.hour === null ? t("common.today") : t(greetingKey(day.hour))}
          </h1>
          <p className="mt-2 font-display text-[1.5rem] italic text-[#F5C766] sm:text-[1.875rem]">{t("today.hero.welcome")}</p>
          <p className="mt-1 min-h-6 text-small font-medium text-[#F3E4CC]">{day.live ? formatDateKey(dateKey, locale) : ""}</p>
          <p className="mt-4 max-w-lg text-body-lg text-[#F3E4CC]">{t("today.hero.sub")}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={routes.practice(locale)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F5B22E] px-7 font-semibold text-[#35180A] shadow-lg shadow-[#000]/30 transition-all hover:-translate-y-0.5 hover:bg-[#F8C04D]">
              {t("today.hero.cta")}
              <Icon name="ArrowRight" size={18} />
            </Link>
            <Link href={routes.sounds(locale)} className="glass inline-flex min-h-12 items-center justify-center rounded-full px-7 font-semibold text-[#fff] transition-colors hover:bg-[#fff]/25">
              {t("today.hero.sounds")}
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Chip icon="Flame">{t("today.chip.streak", { count: n(progress?.streak) })}</Chip>
            <Chip icon="Timer">{t("today.chip.minutes", { count: n(progress?.totalMinutes) })}</Chip>
          </div>
        </div>
      </section>

      {/* ---------- TODAY'S OBSERVANCE ---------- */}
      {todays.map((o) => (
        <section key={o.id} aria-labelledby={`obs-${o.id}`} className="paper-texture reveal relative isolate mx-auto w-full max-w-4xl overflow-hidden rounded-[var(--r-xl)] border border-[color-mix(in_srgb,var(--accent)_45%,var(--divider))] bg-surface p-6 shadow-elev-1 sm:p-8">
          <p id={`obs-${o.id}`} className="font-display text-h2 text-primary">
            {t("today.observance.banner", { name: o.name })}
            {o.lang === "en" && <EnglishMark />}
          </p>
          <ObservanceBody o={o} />
          <FestivalLink obsId={o.id} data={festivals} />
        </section>
      ))}

      {/* ---------- THE SUN TODAY + PLAN ---------- */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="panchang-title"
          aria-busy={!p}
          className="saffron-wash reveal relative min-h-[27rem] overflow-hidden rounded-[var(--r-xl)] border border-[color-mix(in_srgb,var(--primary)_22%,var(--divider))] p-6 shadow-elev-2 sm:p-7 lg:col-span-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow !tracking-wider text-primary">{t("today.sun.title")}</p>
              <h2 id="panchang-title" className="text-[1.75rem] leading-9">
                {t("today.panchang.title")}
              </h2>
              <p className="flex items-center gap-1 text-small text-text-muted">
                <Icon name="MapPin" size={14} />
                {day.citySet ? cityName(city, locale) : t("today.panchang.defaultCity").split("·")[0]}
              </p>
            </div>
            <Link href={routes.calendar(locale)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface px-4 text-small font-semibold text-primary shadow-sm hover:bg-primary-tint">
              {t("today.panchang.full")}
              <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
          {p && (
            <>
              <div className="mt-4 flex flex-col items-center text-primary">
                <SunArc frac={frac} />
                <div className="-mt-1 flex w-full max-w-[22rem] justify-between text-text">
                  <span>
                    <span className="block text-caption text-text-muted">{t("today.tile.sunrise")}</span>
                    <span className="font-semibold">{time(p.sunrise)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-caption text-text-muted">{t("today.tile.sunset")}</span>
                    <span className="font-semibold">{time(p.sunset)}</span>
                  </span>
                </div>
                <p className="mt-2 text-center font-display text-[1.25rem] italic text-text">{sunLine}</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-surface/85 p-3.5 shadow-sm">
                  <p className="text-caption font-semibold text-primary">{t(`paksha.${p.tithi.paksha}`)}</p>
                  <p className="font-semibold leading-snug">{t("today.panchang.tithi", { tithi: t(tithiKey(p.tithi.index)) })}</p>
                  <p className="text-small text-text-muted">{t("today.panchang.until", { time: time(p.tithi.endsAt) })}</p>
                </div>
                <div className="rounded-2xl bg-surface/85 p-3.5 shadow-sm">
                  <p className="font-semibold leading-snug">{t("today.panchang.nakshatra", { nakshatra: t(nakshatraKey(p.nakshatra.index)) })}</p>
                  <p className="text-small text-text-muted">{t("today.panchang.until", { time: time(p.nakshatra.endsAt) })}</p>
                </div>
                <div className="rounded-2xl bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))] p-3.5 shadow-sm">
                  <p className="flex items-center gap-1 text-caption font-semibold text-on-primary-tint">
                    <Icon name="Sparkle" size={14} />
                    {t("today.tile.sacred")}
                  </p>
                  <p className="font-semibold leading-snug">{todays[0] ? todays[0].name : t("today.tile.quiet")}</p>
                </div>
              </div>
              <p className="mt-4 text-small text-text-muted">{t("today.panchang.indicative")}</p>
              <Link href={routes.settings(locale)} className="inline-flex min-h-11 items-center text-small text-primary underline underline-offset-2">
                {day.citySet ? t("today.panchang.city", { city: cityName(city, locale) }) : t("today.panchang.defaultCity")}
              </Link>
              {!day.citySet && <p className="text-small text-text-muted">{t("today.panchang.setCity")}</p>}
            </>
          )}
        </section>
        <div className="reveal lg:col-span-5">{plan}</div>
      </div>

      {/* ---------- SHLOKA ---------- */}
      {verse && <div className="reveal mx-auto w-full max-w-3xl">{verse}</div>}

      {/* ---------- EXPLORE BENTO ---------- */}
      <section aria-labelledby="bento-title">
        <div className="mb-5 text-center">
          <h2 id="bento-title" className="text-[2rem] leading-tight sm:text-[2.5rem]">
            {t("today.bento.title")}
          </h2>
          <p className="mx-auto mt-1 max-w-xl text-text-muted">{t("today.bento.sub")}</p>
        </div>
        <ul className="bento">
          {explore}
          <li className="tile reveal order-4 border border-[color-mix(in_srgb,var(--accent)_40%,var(--divider))] bg-[linear-gradient(150deg,#FBE3B8,#F6C987)] shadow-elev-1">
            <Link href={`${routes.calendar(locale)}festivals/`} className="group flex h-full flex-col justify-between gap-3 p-5 text-[#3A1A0B]">
              <span className="flex items-center gap-1.5 text-caption font-semibold">
                <Icon name="Flame" size={14} />
                {t("today.next.title")}
              </span>
              {nextSacred ? (
                <span>
                  <span className="block font-display text-[2.25rem] font-bold leading-none">{inDays === 1 ? t("today.next.tomorrow") : t("today.next.in", { count: inDays })}</span>
                  <span className="mt-1 block font-semibold leading-snug">
                    <ObservanceName o={nextSacred.o} />
                  </span>
                  <span className="block text-small">{formatDateKey(nextSacred.date, locale, { weekday: "short", day: "numeric", month: "short" })}</span>
                </span>
              ) : (
                <span className="font-semibold">{t("cal.noneWeek")}</span>
              )}
            </Link>
          </li>
        </ul>
      </section>

      {/* ---------- UPCOMING: swipe row ---------- */}
      <section aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className="mb-3 text-[1.75rem] leading-9">
          {t("today.observance.upcoming")}
        </h2>
        {!covered ? (
          <p className="rounded-2xl border border-dashed border-divider p-5 text-text-muted">{t("cal.outOfRange")}</p>
        ) : next.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-divider p-5 text-text-muted">{t("cal.noneWeek")}</p>
        ) : (
          <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:scroll-px-0 sm:px-0">
            {next.flatMap((g) =>
              g.items.map((o) => (
                <li key={o.id} className="card-lift flex w-[82%] shrink-0 snap-start flex-col rounded-[var(--r-xl)] border border-divider bg-surface p-5 shadow-elev-1 sm:w-[22rem]">
                  <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-tint px-3 py-1 text-caption font-semibold text-on-primary-tint">
                    <Icon name="CalendarHeart" size={14} />
                    {formatDateKey(g.date, locale, { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <p className="mt-3 font-display text-[1.5rem] font-semibold leading-tight">
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

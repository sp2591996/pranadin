"use client";

/**
 * First run (E-11, FR-2, J1, US-01/03/04/05/06/07). Six screens:
 * Language → Welcome + safety (must acknowledge) → Goal → Time & when →
 * City → Anonymous usage choice. Every screen after Welcome has Back and Skip.
 * Skipping everything gives Calm, 10 min, Whenever, New Delhi, analytics off.
 */
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { LOCALE_NATIVE_NAME, LOCALES } from "@/i18n/config";
import { setAnalyticsConsent, track } from "@/features/analytics";
import { useS } from "@/features/shared/strings";
import { useDeviceValue } from "@/features/shared/use-device";
import { btn } from "@/features/shared/ui";
import { CITIES, getCity } from "@/lib/cities";
import { routes } from "@/lib/routes";
import { DEFAULT_PREFS, getPrefs } from "@/lib/storage";
import { GOALS, PLAN_MINUTES, TIME_SLOTS, type Goal, type Locale, type PlanMinutes, type TimeSlot } from "@/lib/types";

const TOTAL = 6;
const SLOT_KEY: Record<TimeSlot, string> = { morning: "when.morning", evening: "when.evening", whenever: "when.any" };

function readStep(): number {
  const m = /^#step-(\d)$/.exec(window.location.hash);
  const n = m ? Number(m[1]) : 0;
  return n >= 0 && n < TOTAL ? n : 0;
}

export function Onboarding() {
  const s = useS();
  const { locale } = useI18n();
  const [step, setStep] = useDeviceValue(readStep, 0);
  const [goal, setGoal] = useDeviceValue<Goal>(() => getPrefs().read().goal, DEFAULT_PREFS.goal);
  const [minutes, setMinutes] = useDeviceValue<PlanMinutes>(() => getPrefs().read().minutes, DEFAULT_PREFS.minutes);
  const [slot, setSlot] = useDeviceValue<TimeSlot>(() => getPrefs().read().slot, DEFAULT_PREFS.slot);
  const [cityId, setCityId] = useDeviceValue<string | null>(() => getPrefs().read().cityId, null);
  const [query, setQuery] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const searchId = useId();

  const go = (n: number) => {
    setStep(n);
    try {
      history.replaceState(null, "", `#step-${n}`);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const finish = (consent: boolean | null) => {
    const prefs = getPrefs();
    prefs.write({ locale, goal, minutes, slot, cityId, onboarded: true });
    if (consent === true) setAnalyticsConsent(true);
    else if (consent === false) setAnalyticsConsent(false);
    track("onboarding_completed", { lang: locale, goal, minutes, city_set: cityId !== null });
    window.location.assign(routes.today(locale));
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES.slice(0, 8);
    return CITIES.filter((c) => c.name.toLowerCase().includes(q) || c.id.includes(q)).slice(0, 12);
  }, [query]);

  const next = () => go(step + 1);
  const back = () => go(Math.max(0, step - 1));

  const nav = (onSkip: () => void, primary: ReactNode) => (
    <div className="mt-8 flex flex-col gap-3">
      {primary}
      <div className="flex justify-between">
        <button type="button" className={btn.ghost} onClick={back}>
          {s("common.back")}
        </button>
        <button type="button" className={btn.ghost} onClick={onSkip}>
          {s("common.skip")}
        </button>
      </div>
    </div>
  );

  const radio = (checked: boolean, onClick: () => void, title: string, desc?: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className="flex min-h-14 w-full flex-col items-start rounded-lg border border-border-input bg-surface px-4 py-3 text-left aria-[checked=true]:border-2 aria-[checked=true]:border-primary aria-[checked=true]:bg-primary-tint"
    >
      <span className="font-semibold">{title}</span>
      {desc ? <span className="text-[14px] leading-5 text-text-muted">{desc}</span> : null}
    </button>
  );

  return (
    <div className="flex flex-col">
      <p className="mb-2 text-[14px] leading-5 text-text-muted">{s("onb.progress", { current: step + 1, total: TOTAL })}</p>
      <ol aria-hidden="true" className="mb-6 flex gap-2">
        {Array.from({ length: TOTAL }, (_, i) => (
          <li key={i} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-divider"}`} />
        ))}
      </ol>

      {step === 0 ? (
        <section aria-labelledby="ob-h">
          <h2 id="ob-h" ref={heading} tabIndex={-1} className="focus:outline-none">
            {s("onb.lang.title")}
          </h2>
          <p className="mb-4 text-text-muted">{s("onb.lang.hint")}</p>
          <div role="radiogroup" aria-labelledby="ob-h" className="flex flex-col gap-3">
            {LOCALES.map((l: Locale) => (
              <Link
                key={l}
                lang={l}
                role="radio"
                aria-checked={l === locale}
                href={`${routes.onboarding(l)}#step-1`}
                onClick={() => getPrefs().write({ locale: l })}
                className="flex min-h-14 items-center rounded-lg border border-border-input bg-surface px-4 text-[18px] aria-[checked=true]:border-2 aria-[checked=true]:border-primary aria-[checked=true]:bg-primary-tint"
              >
                {LOCALE_NATIVE_NAME[l]}
              </Link>
            ))}
          </div>
          <button type="button" className={`${btn.primary} mt-8 w-full`} onClick={next}>
            {s("common.continue")}
          </button>
        </section>
      ) : null}

      {step === 1 ? (
        <section aria-labelledby="ob-h">
          <h2 id="ob-h" ref={heading} tabIndex={-1} className="focus:outline-none">
            {s("onb.welcome.title")}
          </h2>
          <p className="mt-2">{s("onb.welcome.body")}</p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>{s("onb.welcome.point1")}</li>
            <li>{s("onb.welcome.point2")}</li>
            <li>{s("onb.welcome.point3")}</li>
          </ul>
          <div role="note" className="mt-6 rounded-lg bg-warning-tint p-4">
            <h3 className="mb-1 text-[18px] leading-[26px] font-semibold">{s("onb.safety.title")}</h3>
            <p>{s("onb.safety.body")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>{s("onb.safety.point1")}</li>
              <li>{s("onb.safety.point2")}</li>
              <li>{s("onb.safety.point3")}</li>
            </ul>
            <Link href={routes.trust(locale, "disclaimer")} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary underline">
              {s("onb.safety.more")}
            </Link>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            {/* US-03: Today is unreachable until this is tapped. No Skip here. */}
            <button type="button" className={btn.primary} onClick={next}>
              {s("onb.safety.cta")}
            </button>
            <button type="button" className={btn.ghost} onClick={back}>
              {s("common.back")}
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby="ob-h">
          <h2 id="ob-h" ref={heading} tabIndex={-1} className="focus:outline-none">
            {s("onb.goal.title")}
          </h2>
          <p className="mb-4 text-text-muted">{s("onb.goal.hint")}</p>
          <div role="radiogroup" aria-labelledby="ob-h" className="flex flex-col gap-3">
            {GOALS.map((g) => radio(goal === g, () => setGoal(g), s(`goal.${g}`), s(`goal.${g}.desc`)))}
          </div>
          {nav(
            () => {
              setGoal(DEFAULT_PREFS.goal);
              next();
            },
            <button type="button" className={btn.primary} onClick={next}>
              {s("common.continue")}
            </button>,
          )}
        </section>
      ) : null}

      {step === 3 ? (
        <section aria-labelledby="ob-h">
          <h2 id="ob-h" ref={heading} tabIndex={-1} className="focus:outline-none">
            {s("onb.time.title")}
          </h2>
          <p className="mb-4 text-text-muted">{s("onb.time.hint")}</p>
          <div role="radiogroup" aria-labelledby="ob-h" className="grid grid-cols-3 gap-3">
            {PLAN_MINUTES.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={minutes === m} onClick={() => setMinutes(m)} className={`${btn.chip} justify-center`}>
                {s("common.minutesShort", { count: m })}
              </button>
            ))}
          </div>
          <h3 id="when-h" className="mt-6 mb-3 text-[18px] leading-[26px] font-semibold">
            {s("onb.when.title")}
          </h3>
          <div role="radiogroup" aria-labelledby="when-h" className="flex flex-col gap-3">
            {TIME_SLOTS.map((t) => radio(slot === t, () => setSlot(t), s(SLOT_KEY[t])))}
          </div>
          {nav(
            () => {
              setMinutes(DEFAULT_PREFS.minutes);
              setSlot(DEFAULT_PREFS.slot);
              next();
            },
            <button type="button" className={btn.primary} onClick={next}>
              {s("common.continue")}
            </button>,
          )}
        </section>
      ) : null}

      {step === 4 ? (
        <section aria-labelledby="ob-h">
          <h2 id="ob-h" ref={heading} tabIndex={-1} className="focus:outline-none">
            {s("onb.city.title")}
          </h2>
          <p className="mb-4 text-text-muted">{s("onb.city.body")}</p>
          <label htmlFor={searchId} className="font-semibold">
            {s("onb.city.search")}
          </label>
          <input
            id={searchId}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1 min-h-12 w-full rounded-md border border-border-input bg-surface px-3 text-text"
          />
          {cityId ? <p className="mt-2 font-semibold">{s("onb.city.selected", { city: getCity(cityId).name })}</p> : null}
          <div role="radiogroup" aria-label={s("onb.city.title")} className="mt-3 flex flex-col gap-2">
            {results.length === 0 ? (
              <p className="text-text-muted">{s("onb.city.noResults", { query })}</p>
            ) : (
              results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={cityId === c.id}
                  onClick={() => setCityId(c.id)}
                  className="flex min-h-12 items-center rounded-md border border-border-input bg-surface px-4 text-left aria-[checked=true]:border-2 aria-[checked=true]:border-primary aria-[checked=true]:bg-primary-tint"
                >
                  <span lang="en">{c.name}</span>
                </button>
              ))
            )}
          </div>
          <p className="mt-3 text-[14px] leading-5 text-text-muted">{s("onb.city.defaultNote")}</p>
          {nav(
            () => {
              setCityId(null);
              next();
            },
            <button type="button" className={btn.primary} onClick={next}>
              {s("common.continue")}
            </button>,
          )}
        </section>
      ) : null}

      {step === 5 ? (
        <section aria-labelledby="ob-h">
          <h2 id="ob-h" ref={heading} tabIndex={-1} className="focus:outline-none">
            {s("onb.consent.title")}
          </h2>
          <p className="mt-2">{s("onb.consent.body")}</p>
          <Link href={routes.trust(locale, "privacy")} className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary underline">
            {s("privacy.readNotice")}
          </Link>
          {/* US-06: equally prominent, nothing pre-selected. */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button type="button" className={btn.secondary} onClick={() => finish(true)}>
              {s("onb.consent.allow")}
            </button>
            <button type="button" className={btn.secondary} onClick={() => finish(false)}>
              {s("onb.consent.deny")}
            </button>
          </div>
          <p className="mt-3 text-[14px] leading-5 text-text-muted">{s("onb.consent.note")}</p>
          <div className="mt-6 flex justify-between">
            <button type="button" className={btn.ghost} onClick={back}>
              {s("common.back")}
            </button>
            <button type="button" className={btn.ghost} onClick={() => finish(null)}>
              {s("common.skip")}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

"use client";

/** Me / settings (E-11, FR-9, J5, US-23/24/25, US-35). Every change is saved on the device at once. */
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { FeedbackEntry } from "@/components/FeedbackEntry";
import { useI18n } from "@/i18n/client";
import { LOCALE_NATIVE_NAME, LOCALES } from "@/i18n/config";
import { formatDateKey } from "@/i18n/format";
import { analyticsConfigured, setAnalyticsConsent, track } from "@/features/analytics";
import { JournalExport } from "@/features/journal/JournalView";
import { ReminderPanel } from "@/features/reminder/ReminderPanel";
import type { JournalContent } from "@/features/shared/content.server";
import { applyMotionAttr, readLocal, todayKey, writeLocal } from "@/features/shared/device";
import { readTextSize, TEXT_SIZE_PERCENT, TEXT_SIZES, writeTextSize, type TextSize } from "./display";
import { useS } from "@/features/shared/strings";
import { useDeviceValue } from "@/features/shared/use-device";
import { btn, card, ConfirmDialog, Status } from "@/features/shared/ui";
import { CITIES } from "@/lib/cities";
import { routes, TRUST_PAGES } from "@/lib/routes";
import { clearAllData, DEFAULT_PREFS, getPrefs, getStorage } from "@/lib/storage";
import { GOALS, PLAN_MINUTES, TIME_SLOTS, type JournalEntry, type Prefs, type ThemePref } from "@/lib/types";

const SLOT_KEY = { morning: "when.morning", evening: "when.evening", whenever: "when.any" } as const;
const CONSENT_DATE_KEY = "analytics.consentDate.v1";
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-[1.125rem] leading-[1.625rem]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice<T extends string | number>({ label, value, options, onChange, text }: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  text: (v: T) => string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={String(o)} type="button" role="radio" aria-checked={o === value} className={btn.chip} onClick={() => onChange(o)}>
          {text(o)}
        </button>
      ))}
    </div>
  );
}

export function Settings({ journal }: { journal: JournalContent }) {
  const s = useS();
  const { t, locale } = useI18n();
  const [prefs, setPrefs] = useDeviceValue<Prefs>(() => getPrefs().read(), DEFAULT_PREFS);
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [consentDate, setConsentDate] = useDeviceValue<string | null>(() => readLocal<string | null>(CONSENT_DATE_KEY, null), null);
  const [status, setStatus] = useState<string | null>(null);
  const [textSize, setTextSize] = useDeviceValue<TextSize>(readTextSize, "standard");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    void getStorage()
      .then((st) => st.journal.list())
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  if (!prefs) return <div aria-busy="true" className="min-h-[400px]" />;

  const save = (patch: Partial<Omit<Prefs, "v">>) => {
    setPrefs(getPrefs().write(patch));
    setStatus(s("me.saved"));
  };

  const setTheme = (theme: ThemePref) => {
    save({ theme });
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  };

  const motionValue = prefs.reduceMotion === null ? "system" : prefs.reduceMotion ? "on" : "off";
  const setMotion = (v: "system" | "on" | "off") => {
    const pref = v === "system" ? null : v === "on";
    save({ reduceMotion: pref });
    applyMotionAttr(pref);
  };

  const setConsent = (on: boolean) => {
    setAnalyticsConsent(on);
    const d = todayKey();
    writeLocal(CONSENT_DATE_KEY, d);
    setConsentDate(d);
    setPrefs(getPrefs().read());
  };

  const doClear = async () => {
    setConfirmClear(false);
    await clearAllData();
    setStatus(s("privacy.cleared"));
    window.location.assign(routes.onboarding(locale));
  };

  const consentOn = prefs.analyticsConsent === "granted";

  return (
    <div className="flex flex-col gap-8">
      <Status message={status} />

      <Section id="me-lang" title={s("me.language")}>
        <ul className="flex flex-wrap gap-2">
          {LOCALES.map((l) => (
            <li key={l}>
              <Link
                lang={l}
                href={routes.settings(l)}
                aria-current={l === locale ? "true" : undefined}
                onClick={() => {
                  if (l === locale) return;
                  getPrefs().write({ locale: l });
                  track("language_changed", { to: l });
                }}
                className="flex min-h-11 items-center rounded-full border border-border-input px-4 aria-[current=true]:border-primary aria-[current=true]:bg-primary-tint"
              >
                {LOCALE_NATIVE_NAME[l]}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="me-goal" title={s("me.goal")}>
        <Choice label={s("me.goal")} value={prefs.goal} options={GOALS} onChange={(goal) => save({ goal })} text={(g) => s(`goal.${g}`)} />
      </Section>

      <Section id="me-min" title={s("me.minutes")}>
        <Choice label={s("me.minutes")} value={prefs.minutes} options={PLAN_MINUTES} onChange={(minutes) => save({ minutes })} text={(m) => s("common.minutesShort", { count: m })} />
      </Section>

      <Section id="me-when" title={s("me.when")}>
        <Choice label={s("me.when")} value={prefs.slot} options={TIME_SLOTS} onChange={(slot) => save({ slot })} text={(v) => s(SLOT_KEY[v])} />
      </Section>

      <Section id="me-city" title={s("me.city")}>
        <select
          aria-labelledby="me-city"
          value={prefs.cityId ?? ""}
          onChange={(e) => save({ cityId: e.target.value || null })}
          className="min-h-12 rounded-md border border-border-input bg-surface px-3 text-text"
        >
          <option value="">New Delhi (default)</option>
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Section>

      <Section id="me-motion" title={s("me.motion")}>
        <p className="text-text-muted">{s("me.motionHelp")}</p>
        <Choice
          label={s("me.motion")}
          value={motionValue}
          options={["system", "on", "off"] as const}
          onChange={setMotion}
          text={(v) => s(`me.motion.${v}`)}
        />
      </Section>

      <Section id="me-text" title={s("me.textSize")}>
        <Choice
          label={s("me.textSize")}
          value={textSize}
          options={TEXT_SIZES}
          onChange={(v) => {
            setTextSize(v);
            writeTextSize(v);
            setStatus(s("me.saved"));
          }}
          text={(v) => `${s(`textSize.${v}`)} (${TEXT_SIZE_PERCENT[v]}%)`}
        />
        <p className="rounded-md bg-surface-2 p-3 text-[1rem]">{s("me.textPreview")}</p>
      </Section>

      <Section id="me-theme" title={s("me.theme")}>
        <Choice label={s("me.theme")} value={prefs.theme} options={["system", "light", "dark"] as const} onChange={setTheme} text={(v) => s(`theme.${v}`)} />
      </Section>

      <Section id="me-rem" title={s("me.reminder")}>
        <ReminderPanel />
      </Section>

      <Section id="me-privacy" title={s("privacy.title")}>
        <p>{s("privacy.summary")}</p>
        <div className={card}>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              role="switch"
              checked={consentOn}
              onChange={(e) => setConsent(e.target.checked)}
              className="h-5 w-5"
              aria-describedby="consent-help"
            />
            <span className="font-semibold">{s("privacy.analytics")}</span>
          </label>
          <p id="consent-help" className="mt-1 text-[0.875rem] leading-5 text-text-muted">
            {s("privacy.analyticsHelp")}
          </p>
          {consentDate && prefs.analyticsConsent !== "unset" ? (
            <p className="mt-1 text-[0.875rem] leading-5 text-text-muted">
              {s("privacy.consentRecord", { choice: consentOn ? s("common.on") : s("common.off"), date: formatDateKey(consentDate, locale) })}
            </p>
          ) : null}
          {!analyticsConfigured ? (
            <p className="mt-1 text-[0.875rem] leading-5 text-text-muted" lang="en">
              (Beta: no analytics tool is connected yet, so nothing is sent either way.)
            </p>
          ) : null}
          <Link href={routes.trust(locale, "privacy")} className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary underline">
            {s("privacy.readNotice")}
          </Link>
        </div>

        <div className={card}>
          <h3 className="mb-2 font-semibold">{s("journal.export")}</h3>
          <JournalExport content={journal} entries={entries} />
        </div>

        <div className={card}>
          <h3 className="mb-2 font-semibold">{s("privacy.clear")}</h3>
          <p className="mb-3 text-text-muted">{s("privacy.clear.body")}</p>
          <button type="button" className={btn.danger} onClick={() => setConfirmClear(true)}>
            {s("privacy.clear")}
          </button>
        </div>
      </Section>

      <Section id="me-help" title={s("help.title")}>
        <p>{s("help.notMedical")}</p>
        <div className={card}>
          <h3 className="font-semibold">{s("help.whenToStop")}</h3>
          <p className="mt-1">{s("help.whenToStopBody")}</p>
          <h3 className="mt-3 font-semibold">{s("help.emergency")}</h3>
          <p className="mt-1">{s("help.emergencyBody")}</p>
          <h3 className="mt-3 font-semibold">{s("help.mental")}</h3>
          <p className="mt-1">{s("help.mentalBody")}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href="tel:112" className={btn.secondary}>
              {s("help.call112")}
            </a>
            <a href="tel:14416" className={btn.secondary}>
              {s("help.callTeleManas")}
            </a>
          </div>
        </div>
      </Section>

      <nav aria-labelledby="me-trust">
        <h2 id="me-trust" className="mb-3 text-[1.125rem] leading-[1.625rem]">
          {s("me.trust")}
        </h2>
        <ul className="divide-y divide-divider rounded-lg border border-divider bg-surface">
          {TRUST_PAGES.map((p) => (
            <li key={p}>
              <Link href={routes.trust(locale, p)} className="flex min-h-14 items-center px-4">
                {t(`trust.${p}`)}
              </Link>
            </li>
          ))}
          <FeedbackEntry />
        </ul>
      </nav>

      <p className="text-center text-[0.875rem] leading-5 text-text-muted">{s("me.version", { version: VERSION })}</p>

      <ConfirmDialog
        open={confirmClear}
        title={s("privacy.clear.title")}
        body={<p>{s("privacy.clear.body")}</p>}
        confirmLabel={s("privacy.clear.confirm")}
        cancelLabel={s("privacy.clear.keep")}
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => void doClear()}
      />
    </div>
  );
}

"use client";

import type { Observance } from "@/content/load";
import { useI18n } from "@/i18n/client";
import { formatDateKey } from "@/i18n/format";
import type { MessageKey } from "@/i18n/keys";

/**
 * "English" marker for one item shown in English on a hi/mr screen (US-02,
 * FR-1.3, QA-11). The label is the UI string `lang.name.en`, so it appears in
 * the user's language once the Board reviews it.
 */
export function EnglishMark({ onDark = false }: { onDark?: boolean }) {
  const { t, locale } = useI18n();
  if (locale === "en") return null;
  const look = onDark ? "border-white/40 text-white" : "border-divider text-text-muted";
  return (
    <span className={`ms-2 inline-block rounded-sm border px-1.5 align-middle font-sans text-caption ${look}`} lang={locale}>
      {t("lang.name.en")}
    </span>
  );
}

/** Observance name. Use inside a heading or paragraph. */
export function ObservanceName({ o }: { o: Observance }) {
  return (
    <>
      <span lang={o.lang}>{o.name}</span>
      {o.lang === "en" && <EnglishMark />}
    </>
  );
}

/** Tags, note, flag texts, date range and sources for one observance (E-06, US-18, US-26). */
export function ObservanceBody({ o }: { o: Observance }) {
  const { t, locale } = useI18n();
  return (
    <>
      <ul className="mt-1 flex flex-wrap gap-2" aria-label={t("cal.filter.label")}>
        {o.traditions.map((tr) => (
          <li key={tr} className="rounded-full bg-[var(--tradition-tag-bg)] px-2 text-caption text-[var(--tradition-tag-fg)]">
            {t(`tradition.${tr}`)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-small">
        <span lang={o.noteLang}>{o.note}</span>
        {o.noteLang === "en" && o.lang !== "en" && <EnglishMark />}
      </p>
      {o.flagKeys.map((k) => (
        <p key={k} className="mt-1 text-small text-text-muted">
          {t(k as MessageKey)}
        </p>
      ))}
      {o.endDate && (
        <p className="mt-1 text-small text-text-muted">
          {t("cal.obs.range", {
            start: formatDateKey(o.date, locale, { day: "numeric", month: "short" }),
            end: formatDateKey(o.endDate, locale, { day: "numeric", month: "short" }),
          })}
        </p>
      )}
      {o.sources.length > 0 && (
        <div className="mt-1 text-caption text-text-muted">
          <p>{t("cal.obs.sources")}:</p>
          <ul>
            {o.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 min-w-11 items-center underline underline-offset-2"
                >
                  <span lang="en">{s.name}</span>
                  <span className="sr-only"> ({t("a11y.opensOutside")})</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

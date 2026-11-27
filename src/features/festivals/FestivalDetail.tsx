"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Mandala } from "@/components/Mandala";
import { useLocalDay } from "@/components/useLocalDay";
import { useI18n } from "@/i18n/client";
import { formatDateKey } from "@/i18n/format";
import { useS } from "@/features/shared/strings";
import { TRAD_ART } from "./art";
import { festivalRoutes } from "./routes";
import type { FestivalView } from "./types";

const DAY_MS = 86_400_000;
const daysBetween = (a: string, b: string) =>
  Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS,
  );

function Block({
  id,
  title,
  children,
  tone = "plain",
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  tone?: "plain" | "gold";
}) {
  const look =
    tone === "gold" ? "brand-gold" : "border border-divider bg-surface";
  return (
    <section
      aria-labelledby={id}
      className={`rounded-[var(--r-xl)] p-5 shadow-elev-1 ${look}`}
    >
      <h2
        id={id}
        className="mb-2 font-display text-[1.5rem] font-semibold leading-tight"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/** One festival (D-037): brand banner with the next date, story blocks, and the home steps in a side panel. */
export function FestivalDetail({
  festival: f,
  buildDate,
  window,
}: {
  festival: FestivalView;
  buildDate: string;
  window: { from: string; to: string };
}) {
  const s = useS();
  const { t, locale } = useI18n();
  const day = useLocalDay(buildDate);
  const next = f.dates.find((d) => d >= day.dateKey);
  const inDays = next ? daysBetween(day.dateKey, next) : null;
  const range = { year: "numeric", month: "short", day: "numeric" } as const;
  const art = TRAD_ART[f.traditions[0]!] ?? TRAD_ART.hindu;
  return (
    <article className="wide flex flex-col gap-6">
      <Link
        href={festivalRoutes.list(locale)}
        className="inline-flex min-h-11 items-center self-start text-primary underline underline-offset-2"
      >
        {s("festivals.back")}
      </Link>

      <header
        className={`${art} brand-glow relative isolate -mx-4 overflow-hidden px-5 py-8 text-white sm:mx-0 sm:rounded-[var(--r-xl)] sm:px-8 sm:py-10`}
      >
        <Mandala className="slow-spin absolute -right-20 -top-20 -z-10 h-[360px] w-[360px] text-[#F3C35B] opacity-25" />
        <p className="flex flex-wrap gap-2">
          {f.traditions.map((tr) => (
            <span
              key={tr}
              className="glass rounded-full px-3 py-1 text-small text-white"
            >
              {t(`tradition.${tr}`)}
            </span>
          ))}
        </p>
        <h1
          lang={f.name.lang}
          className="mt-3 font-display text-[2.5rem] font-semibold leading-tight text-white sm:text-[3.25rem]"
        >
          {f.name.text}
        </h1>
        <p
          className="mt-1 max-w-2xl text-[1.125rem] text-[#F3E4CC]"
          lang={f.tagline.lang}
        >
          {f.tagline.text}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {inDays !== null && inDays > 0 && (
            <span className="inline-flex min-h-12 items-center rounded-2xl bg-[#F5B22E] px-4 font-display text-[1.375rem] font-bold text-[#35180A]">
              {t("today.next.in", { count: inDays })}
            </span>
          )}
          <div>
            <p className="font-semibold text-white" data-testid="next-date">
              {next
                ? s("festivals.nextDate", {
                    date: formatDateKey(next, locale, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  })
                : s("festivals.noDate", {
                    from: formatDateKey(window.from, locale, range),
                    to: formatDateKey(window.to, locale, range),
                  })}
            </p>
            <p className="text-small text-[#F3E4CC]">
              {s("festivals.datesVary")}
            </p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-7">
          <Block id="fs-story" title={s("festivals.story")}>
            <p lang={f.story.lang} className="text-[1.0625rem] leading-relaxed">
              {f.story.text}
            </p>
            <p
              className="mt-2 text-small text-text-muted"
              lang={f.storySource.lang}
            >
              {f.storySource.text}
            </p>
          </Block>
          <Block id="fs-why" title={s("festivals.why")}>
            <p lang={f.why.lang}>{f.why.text}</p>
          </Block>
          <div className="grid gap-5 sm:grid-cols-2">
            <Block id="fs-regional" title={s("festivals.regional")}>
              <p lang={f.regional.lang}>{f.regional.text}</p>
            </Block>
            <Block id="fs-foods" title={s("festivals.foods")} tone="gold">
              <p lang={f.foods.lang}>{f.foods.text}</p>
            </Block>
          </div>
          <Block id="fs-note" title={s("festivals.note")}>
            <p lang={f.note.lang}>{f.note.text}</p>
          </Block>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:col-span-5">
          <section
            aria-labelledby="fs-steps"
            className="brand-earth brand-glow relative isolate overflow-hidden rounded-[var(--r-xl)] p-6 text-white shadow-elev-2"
          >
            <h2
              id="fs-steps"
              className="font-display text-[1.625rem] font-semibold leading-tight text-white"
            >
              {s("festivals.steps")}
            </h2>
            <ol className="mt-4 flex flex-col gap-3">
              {f.steps.map((st, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5B22E] font-display text-[1.0625rem] font-bold text-[#35180A]"
                  >
                    {i + 1}
                  </span>
                  <span lang={st.lang} className="pt-1 text-[#FBEFDD]">
                    {st.text}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-small text-[#F3E4CC]">
              {s("festivals.timingNote")}
            </p>
          </section>

          <section
            aria-labelledby="fs-sources"
            className="rounded-[var(--r-xl)] border border-divider bg-surface p-5"
          >
            <h2
              id="fs-sources"
              className="mb-1 font-display text-[1.375rem] font-semibold"
            >
              {s("festivals.sources")}
            </h2>
            <ul className="flex flex-col text-small">
              {f.sources.map((src) => (
                <li key={src.url}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    lang="en"
                    className="inline-flex min-h-11 items-center gap-1.5 text-primary underline underline-offset-2"
                  >
                    {src.label}
                    <Icon name="ArrowRight" size={14} />
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <p className="text-small text-text-muted">
            {s("festivals.disclaimer")}
          </p>
        </aside>
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { Mandala } from "@/components/Mandala";
import { useLocalDay } from "@/components/useLocalDay";
import { useI18n } from "@/i18n/client";
import { formatDateKey } from "@/i18n/format";
import { useS } from "@/features/shared/strings";
import { card } from "@/features/shared/ui";
import { festivalRoutes } from "./routes";
import type { FestivalView } from "./types";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={card}>
      <h2 id={id} className="mb-2 text-h3">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** One festival: story, why it matters, how to observe at home, regional ways, foods, note, sources. */
export function FestivalDetail({ festival: f, buildDate, window }: { festival: FestivalView; buildDate: string; window: { from: string; to: string } }) {
  const s = useS();
  const { locale } = useI18n();
  const day = useLocalDay(buildDate);
  const next = f.dates.find((d) => d >= day.dateKey);
  const range = { year: "numeric", month: "short", day: "numeric" } as const;
  return (
    <article className="flex flex-col gap-5">
      <Link href={festivalRoutes.list(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
        {s("festivals.back")}
      </Link>
      <header className="relative isolate overflow-hidden rounded-2xl border border-divider shadow-elev-1 bg-[var(--card-hero-bg)] p-4">
        <Mandala className="absolute -right-12 -top-12 -z-10 h-48 w-48 text-[var(--accent)] opacity-40" />
        <h1 lang={f.name.lang}>{f.name.text}</h1>
        <p className="text-text-muted" lang={f.tagline.lang}>
          {f.tagline.text}
        </p>
        <p className="mt-3 font-semibold" data-testid="next-date">
          {next
            ? s("festivals.nextDate", { date: formatDateKey(next, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) })
            : s("festivals.noDate", { from: formatDateKey(window.from, locale, range), to: formatDateKey(window.to, locale, range) })}
        </p>
        <p className="text-small text-text-muted">{s("festivals.datesVary")}</p>
      </header>

      <Section id="fs-story" title={s("festivals.story")}>
        <p lang={f.story.lang}>{f.story.text}</p>
        <p className="mt-2 text-small text-text-muted" lang={f.storySource.lang}>
          {f.storySource.text}
        </p>
      </Section>
      <Section id="fs-why" title={s("festivals.why")}>
        <p lang={f.why.lang}>{f.why.text}</p>
      </Section>
      <Section id="fs-steps" title={s("festivals.steps")}>
        <ol className="flex list-decimal flex-col gap-2 ps-5">
          {f.steps.map((st, i) => (
            <li key={i} lang={st.lang}>
              {st.text}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-small text-text-muted">{s("festivals.timingNote")}</p>
      </Section>
      <Section id="fs-regional" title={s("festivals.regional")}>
        <p lang={f.regional.lang}>{f.regional.text}</p>
      </Section>
      <Section id="fs-foods" title={s("festivals.foods")}>
        <p lang={f.foods.lang}>{f.foods.text}</p>
      </Section>
      <Section id="fs-note" title={s("festivals.note")}>
        <p lang={f.note.lang}>{f.note.text}</p>
      </Section>

      <section aria-labelledby="fs-sources">
        <h2 id="fs-sources" className="mb-2 text-h3">
          {s("festivals.sources")}
        </h2>
        <ul className="flex flex-col gap-1 text-small">
          {f.sources.map((src) => (
            <li key={src.url}>
              <a href={src.url} target="_blank" rel="noopener noreferrer" lang="en" className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
                {src.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-small text-text-muted">{s("festivals.disclaimer")}</p>
    </article>
  );
}

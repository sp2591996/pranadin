"use client";

import Link from "next/link";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { card } from "@/features/shared/ui";
import { EnglishMark } from "@/components/ObservanceBody";
import { FallbackNote } from "@/components/FallbackNote";
import { YogaImage } from "./YogaImage";
import { yogaRoutes } from "./routes";
import type { PoseListItem, YogaPose } from "./types";

/** One pose: image, steps, what it offers, cautions and sources. Pose text is English until reviewed. */
export function PoseDetail({ pose, item }: { pose: YogaPose; item: PoseListItem }) {
  const s = useS();
  const { locale } = useI18n();
  const lang = "en";
  return (
    <article className="flex flex-col gap-5">
      <Link href={yogaRoutes.home(locale)} className="inline-flex min-h-11 items-center gap-1 text-primary">
        <CaretLeftIcon size={18} aria-hidden="true" />
        {s("yoga.pose.back")}
      </Link>
      <FallbackNote />
      <header>
        <h1>
          <span lang={item.nameLang}>{item.name}</span>
          {item.nameLang === "en" ? <EnglishMark /> : null}
        </h1>
        <p className="text-text-muted">
          <span lang="sa">{pose.sanskrit}</span> · <span lang="en">{pose.transliteration}</span>
        </p>
        <p className="mt-1 text-[0.875rem] leading-5 text-text-muted">
          {s(`yoga.level.${pose.level}`)} · {s(`yoga.cat.${pose.category}`)} · {s("yoga.stay", { seconds: pose.holdSeconds })}
        </p>
      </header>

      <YogaImage file={pose.image.file} alt={pose.image.alt} priority />

      <div lang={lang} className="flex flex-col gap-5">
        <p>{pose.summary}</p>

        <section aria-labelledby="how-h">
          <h2 id="how-h">{s("yoga.pose.how")}</h2>
          <ol className="list-decimal space-y-2 ps-5">
            {pose.steps.map((st) => (
              <li key={st}>{st}</li>
            ))}
          </ol>
          <p className="mt-3">
            <strong>{s("yoga.pose.breath")}: </strong>
            {pose.breathTip}
          </p>
        </section>

        <section aria-labelledby="ben-h">
          <h2 id="ben-h">{s("yoga.pose.benefits")}</h2>
          <ul className="list-disc space-y-1 ps-5">
            {pose.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="care-h" className={card}>
          <h2 id="care-h">{s("yoga.pose.cautions")}</h2>
          <ul className="list-disc space-y-1 ps-5">
            {pose.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="mt-3 text-[0.875rem] leading-5 text-text-muted" lang={locale}>
            {s("yoga.safety.2")}
          </p>
        </section>

        <section aria-labelledby="src-h">
          <h2 id="src-h" lang={locale}>
            {s("yoga.pose.sources")}
          </h2>
          <ul className="space-y-1 text-[0.875rem] leading-5 text-text-muted">
            {pose.sources.map((src) => (
              <li key={src.name}>
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-2">
                    {src.name}
                    <span className="sr-only"> ({s("a11y.opensOutside")})</span>
                  </a>
                ) : (
                  src.name
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}

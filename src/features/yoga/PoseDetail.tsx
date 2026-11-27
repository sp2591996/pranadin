"use client";

import Link from "next/link";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { EnglishMark } from "@/components/ObservanceBody";
import { FallbackNote } from "@/components/FallbackNote";
import { YogaImage } from "./YogaImage";
import { yogaRoutes } from "./routes";
import type { PoseListItem, YogaPose } from "./types";

/** One pose: image, steps, what it offers, cautions and sources. Draft translations are shown (D-030). */
export function PoseDetail({
  pose,
  item,
}: {
  pose: YogaPose;
  item: PoseListItem;
}) {
  const s = useS();
  const { locale } = useI18n();
  const lang = item.nameLang;
  const stat = "flex flex-col rounded-2xl bg-white/10 px-4 py-2.5";
  return (
    <article className="wide flex flex-col gap-6">
      <Link
        href={yogaRoutes.home(locale)}
        className="inline-flex min-h-11 items-center gap-1 self-start text-primary"
      >
        <CaretLeftIcon size={18} aria-hidden="true" />
        {s("yoga.pose.back")}
      </Link>
      <FallbackNote />
      <header className="brand-saffron brand-glow relative isolate -mx-4 overflow-hidden px-5 py-7 text-white sm:mx-0 sm:rounded-[var(--r-xl)] sm:px-8">
        <h1 className="font-display text-[2.25rem] font-semibold leading-tight text-white sm:text-[2.75rem]">
          <span lang={item.nameLang}>{item.name}</span>
          {item.nameLang === "en" ? <EnglishMark onDark /> : null}
        </h1>
        <p className="text-[1.125rem] text-[#FBE7C2]">
          <span lang="sa">{pose.sanskrit}</span> ·{" "}
          <span lang="en">{pose.transliteration}</span>
        </p>
        <p className="mt-5 flex flex-wrap gap-2 text-small font-semibold">
          <span className={stat}>{s(`yoga.level.${pose.level}`)}</span>
          <span className={stat}>{s(`yoga.cat.${pose.category}`)}</span>
          <span className={stat}>
            {s("yoga.stay", { seconds: pose.holdSeconds })}
          </span>
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-5">
          <div className="overflow-hidden rounded-[var(--r-xl)] bg-surface shadow-elev-1">
            <YogaImage file={pose.image.file} alt={pose.image.alt} priority />
          </div>
          <p lang={lang} className="text-[1.0625rem] leading-relaxed">
            {pose.summary}
          </p>
        </div>

        <div lang={lang} className="flex min-w-0 flex-col gap-5 lg:col-span-7">
          <section
            aria-labelledby="how-h"
            className="rounded-[var(--r-xl)] border border-divider bg-surface p-5 shadow-elev-1"
          >
            <h2
              id="how-h"
              className="font-display text-[1.625rem] font-semibold"
            >
              {s("yoga.pose.how")}
            </h2>
            <ol className="mt-3 flex flex-col gap-3">
              {pose.steps.map((st, i) => (
                <li key={st} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="brand-saffron flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-[1.0625rem] font-bold text-white"
                  >
                    {i + 1}
                  </span>
                  <span className="pt-1">{st}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-2xl bg-primary-tint p-4 text-on-primary-tint">
              <strong>{s("yoga.pose.breath")}: </strong>
              {pose.breathTip}
            </p>
          </section>

          <section
            aria-labelledby="ben-h"
            className="rounded-[var(--r-xl)] border border-divider bg-surface p-5 shadow-elev-1"
          >
            <h2
              id="ben-h"
              className="font-display text-[1.625rem] font-semibold"
            >
              {s("yoga.pose.benefits")}
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {pose.benefits.map((b) => (
                <li
                  key={b}
                  className="flex gap-2.5 rounded-xl bg-surface-2 p-3"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                  />
                  {b}
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="care-h"
            className="brand-gold rounded-[var(--r-xl)] p-5 shadow-elev-1"
          >
            <h2
              id="care-h"
              className="font-display text-[1.625rem] font-semibold"
            >
              {s("yoga.pose.cautions")}
            </h2>
            <ul className="mt-2 list-disc space-y-1 ps-5">
              {pose.cautions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="mt-3 text-[0.875rem] leading-5" lang={locale}>
              {s("yoga.safety.2")}
            </p>
          </section>

          <section aria-labelledby="src-h">
            <h2 id="src-h" lang={locale} className="text-h3">
              {s("yoga.pose.sources")}
            </h2>
            <ul className="space-y-1 text-[0.875rem] leading-5 text-text-muted">
              {pose.sources.map((src) => (
                <li key={src.name}>
                  {src.url ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center underline underline-offset-2"
                    >
                      <span lang="en">{src.name}</span>
                      <span className="sr-only">
                        {" "}
                        ({s("a11y.opensOutside")})
                      </span>
                    </a>
                  ) : (
                    <span lang="en">{src.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </article>
  );
}

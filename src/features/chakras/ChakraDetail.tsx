"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { card } from "@/features/shared/ui";
import { ChakraMotif } from "./Motif";
import { chakraRoutes } from "./routes";
import type { ChakraView, Txt } from "./types";

function Fact({ label, v }: { label: string; v: Txt }) {
  return (
    <div>
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="font-semibold" lang={v.lang}>
        {v.text}
      </dd>
    </div>
  );
}

/** One chakra: names, facts, a short contemplative practice, sources. Tradition, not medicine. */
export function ChakraDetail({ chakra: c }: { chakra: ChakraView }) {
  const s = useS();
  const { locale } = useI18n();
  return (
    <article className="flex flex-col gap-5">
      <Link href={chakraRoutes.list(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
        {s("chakras.back")}
      </Link>
      <header className="flex items-center gap-4">
        <ChakraMotif n={c.n} petals={c.petals} hex={c.hex} label={s("chakras.motifLabel", { count: c.petals })} className="h-28 w-28 shrink-0" />
        <div>
          <h1 lang="sa">{c.sa}</h1>
          <p className="font-semibold">
            {c.iast} · <span lang={c.nick.lang}>{c.nick.text}</span>
          </p>
          <p className="text-small text-text-muted">
            {s("chakras.meaningOf")}: <span lang={c.meaning.lang}>{c.meaning.text}</span>
          </p>
        </div>
      </header>

      <p lang={c.about.lang}>{c.about.text}</p>

      <dl className={`${card} grid grid-cols-2 gap-4`}>
        <Fact label={s("chakras.location")} v={c.location} />
        <Fact label={s("chakras.element")} v={c.element} />
        <Fact label={s("chakras.colour")} v={c.colour} />
        <div>
          <dt className="text-small text-text-muted">{s("chakras.bija")}</dt>
          <dd className="font-semibold">
            {c.bija ? (
              <>
                <span lang="sa">{c.bija.sa}</span> ({c.bija.iast})
              </>
            ) : (
              <span className="font-normal">{s("chakras.noBija")}</span>
            )}
          </dd>
        </div>
        <div className="col-span-2 text-small text-text-muted">{s("chakras.petals", { count: c.petals })}</div>
      </dl>
      <p className="text-small text-text-muted">{s("chakras.colourNote")}</p>

      <section aria-labelledby="ch-practice" className={card}>
        <h2 id="ch-practice" className="mb-2">
          {s("chakras.practice")}
        </h2>
        <p lang={c.practice.lang}>{c.practice.text}</p>
        <p className="mt-3 text-small text-text-muted">{s("chakras.affirmation")}</p>
        <p className="font-semibold" lang={c.affirmation.lang}>
          {c.affirmation.text}
        </p>
      </section>

      <section aria-labelledby="ch-sources">
        <h2 id="ch-sources" className="mb-2 text-h3">
          {s("chakras.sources")}
        </h2>
        <ul className="flex flex-col gap-1 text-small">
          {c.sources.map((src) => (
            <li key={src.url}>
              <a href={src.url} target="_blank" rel="noopener noreferrer" lang="en" className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
                {src.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-small text-text-muted">{s("chakras.disclaimer")}</p>
    </article>
  );
}

"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { ChakraMotif } from "./Motif";
import { chakraRoutes } from "./routes";
import type { ChakraView, Txt } from "./types";

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-divider bg-surface p-4 shadow-elev-1">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-[1.25rem] font-semibold leading-snug">
        {children}
      </dd>
    </div>
  );
}
const tx = (v: Txt) => <span lang={v.lang}>{v.text}</span>;

/** One chakra (D-037): motif banner, fact tiles, a short contemplative practice, sources. Tradition, not medicine. */
export function ChakraDetail({ chakra: c }: { chakra: ChakraView }) {
  const s = useS();
  const { locale } = useI18n();
  return (
    <article className="wide flex flex-col gap-6">
      <Link
        href={chakraRoutes.list(locale)}
        className="inline-flex min-h-11 items-center self-start text-primary underline underline-offset-2"
      >
        {s("chakras.back")}
      </Link>
      <header className="brand-earth brand-glow relative isolate -mx-4 flex flex-col items-center gap-6 overflow-hidden px-5 py-8 text-center text-white sm:mx-0 sm:flex-row sm:rounded-[var(--r-xl)] sm:px-10 sm:text-left">
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-[#FBEFDD] shadow-elev-2 sm:h-48 sm:w-48">
          <ChakraMotif
            n={c.n}
            petals={c.petals}
            hex={c.hex}
            label={s("chakras.motifLabel", { count: c.petals })}
            className="h-32 w-32 sm:h-40 sm:w-40"
          />
        </span>
        <div>
          <h1
            lang="sa"
            className="font-display text-[2.5rem] font-semibold leading-tight text-white sm:text-[3rem]"
          >
            {c.sa}
          </h1>
          <p className="text-[1.125rem] font-semibold text-[#F5B22E]">
            {c.iast} · <span lang={c.nick.lang}>{c.nick.text}</span>
          </p>
          <p className="mt-1 text-[#F3E4CC]">
            {s("chakras.meaningOf")}:{" "}
            <span lang={c.meaning.lang}>{c.meaning.text}</span>
          </p>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-7">
          <p lang={c.about.lang} className="text-[1.125rem] leading-relaxed">
            {c.about.text}
          </p>
          <dl className="grid grid-cols-2 gap-3">
            <Fact label={s("chakras.location")}>{tx(c.location)}</Fact>
            <Fact label={s("chakras.element")}>{tx(c.element)}</Fact>
            <Fact label={s("chakras.colour")}>
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 rounded-full border border-divider"
                  style={{ background: c.hex }}
                />
                {tx(c.colour)}
              </span>
            </Fact>
            <Fact label={s("chakras.bija")}>
              {c.bija ? (
                <>
                  <span lang="sa">{c.bija.sa}</span> ({c.bija.iast})
                </>
              ) : (
                <span className="font-sans text-base font-normal">
                  {s("chakras.noBija")}
                </span>
              )}
            </Fact>
          </dl>
          <p className="text-small text-text-muted">
            {s("chakras.petals", { count: c.petals })} {s("chakras.colourNote")}
          </p>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:col-span-5">
          <section
            aria-labelledby="ch-practice"
            className="brand-gold rounded-[var(--r-xl)] p-6 shadow-elev-1"
          >
            <h2
              id="ch-practice"
              className="font-display text-[1.625rem] font-semibold"
            >
              {s("chakras.practice")}
            </h2>
            <p lang={c.practice.lang} className="mt-2">
              {c.practice.text}
            </p>
            <p className="mt-4 text-small font-semibold">
              {s("chakras.affirmation")}
            </p>
            <p
              className="mt-1 font-display text-[1.375rem] font-semibold leading-snug"
              lang={c.affirmation.lang}
            >
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
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    lang="en"
                    className="inline-flex min-h-11 items-center text-primary underline underline-offset-2"
                  >
                    {src.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-small text-text-muted">
            {s("chakras.disclaimer")}
          </p>
        </aside>
      </div>
    </article>
  );
}

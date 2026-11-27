/* eslint-disable @next/next/no-img-element -- static export, server-rendered pictures with fixed sizes */
/**
 * Stories pages (D-038). Server components only: no JavaScript is sent.
 * List: grouped by tradition, then region. Detail: picture-led scenes,
 * the lesson, sources and full picture credits.
 */
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Mandala } from "@/components/Mandala";
import { formatMessage } from "@/features/shared/format-message";
import { festivalRoutes } from "@/features/festivals/routes";
import { yatraRoutes } from "@/features/yatra/routes";
import type { Locale } from "@/i18n/config";
import { storyGroups, storyRoutes, type StoryView, type Txt } from "./content.server";

type S = (key: string, params?: Record<string, string | number>) => string;
export const makeS =
  (strings: Record<string, string>, locale: Locale): S =>
  (key, params) =>
    formatMessage(strings[key] ?? key, params ?? {}, locale);

const T = ({ t, className }: { t: Txt; className?: string }) => (
  <span lang={t.lang} className={className}>
    {t.text}
  </span>
);

/** Tradition accent (same family as the calendar dots). */
const ACCENT: Record<string, string> = {
  hindu: "#B4500F",
  sikh: "#1D4F91",
  jain: "#7A5000",
  buddhist: "#7B3FB0",
  christian: "#A31C1C",
  islamic: "#14683A",
  parsi: "#A0174F",
};

function StoryCard({ st, locale, s, tradLabel }: { st: StoryView; locale: Locale; s: S; tradLabel: string }) {
  const img = st.images[0]!;
  return (
    <li className="flex">
      <Link
        href={storyRoutes.detail(locale, st.id)}
        className="card-lift group flex flex-1 flex-col overflow-hidden rounded-2xl border border-divider bg-surface shadow-elev-1"
      >
        <span className="relative block aspect-[4/3] overflow-hidden bg-[#2A1408]">
          <img
            src={img.src}
            alt=""
            width={img.w}
            height={img.h}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
          <span aria-hidden="true" className="photo-shade absolute inset-0" />
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-caption font-semibold text-white"
            style={{ background: ACCENT[st.tradition] }}
          >
            {tradLabel}
          </span>
          <span className="absolute bottom-3 left-4 right-4 text-small font-semibold text-[#F3E4CC]">
            <T t={st.figure} />
          </span>
        </span>
        <span className="flex flex-1 flex-col gap-2 p-4">
          <span className="font-display text-[1.375rem] font-semibold leading-tight">
            <T t={st.title} />
          </span>
          <span className="text-small text-text-muted">
            <T t={st.teaser} />
          </span>
          <span className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-small font-semibold text-on-primary group-hover:bg-primary-pressed">
              {s("stories.read")}
              <Icon name="ArrowRight" size={16} />
            </span>
            <span className="text-caption text-text-muted">{s("stories.scenes", { count: st.scenes.length })}</span>
          </span>
        </span>
      </Link>
    </li>
  );
}

export function StoryList({
  stories,
  locale,
  strings,
  trad,
}: {
  stories: StoryView[];
  locale: Locale;
  strings: Record<string, string>;
  trad: Record<string, string>;
}) {
  const s = makeS(strings, locale);
  const groups = storyGroups(stories);
  const hero = ["ramayana", "dnyaneshwar", "sacha-sauda"].map((id) => stories.find((x) => x.id === id)?.images[0]).filter(Boolean);
  return (
    <div className="wide flex flex-col gap-8">
      <header className="brand-earth brand-glow relative isolate -mx-4 grid items-center gap-6 overflow-hidden px-5 py-8 text-white sm:mx-0 sm:rounded-[var(--r-xl)] sm:px-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <Mandala className="slow-spin absolute -left-24 -top-24 -z-10 h-[340px] w-[340px] text-[#F3C35B] opacity-20" />
        <div className="min-w-0">
          <p className="font-deva text-[1.125rem] text-[#F5B22E]" lang="hi" aria-hidden="true">
            {strings["stories.deva"]}
          </p>
          <h1 className="font-display text-[2.5rem] font-semibold leading-tight text-white sm:text-[3rem]">{s("stories.title")}</h1>
          <p className="mt-1 max-w-xl text-[#F3E4CC]">{s("stories.intro")}</p>
          <p className="mt-3 text-small font-semibold text-[#F3D9A4]">{s("stories.count", { count: stories.length })}</p>
        </div>
        <div aria-hidden="true" className="hidden h-48 items-end gap-3 md:flex">
          {hero.map((im, i) => (
            <img
              key={im!.src}
              src={im!.src}
              alt=""
              width={im!.w}
              height={im!.h}
              className={`w-28 rounded-xl object-cover shadow-elev-2 ring-2 ring-[#F5B22E]/50 ${i === 1 ? "h-48" : "h-40"}`}
            />
          ))}
        </div>
      </header>

      <nav aria-label={s("stories.jump")} className="no-scrollbar relative -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {groups.map((g) => (
          <a
            key={g.tradition}
            href={`#tr-${g.tradition}`}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border-input bg-surface px-4 text-small font-semibold hover:border-primary"
          >
            <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: ACCENT[g.tradition] }} />
            {trad[g.tradition]}
            <span className="font-normal text-text-muted">({g.regions.reduce((n, r) => n + r.stories.length, 0)})</span>
          </a>
        ))}
      </nav>

      {groups.map((g) => (
        <section key={g.tradition} id={`tr-${g.tradition}`} aria-labelledby={`h-${g.tradition}`} className="scroll-mt-24">
          <h2 id={`h-${g.tradition}`} className="mb-4 flex items-center gap-3 font-display text-[2rem] font-semibold leading-tight">
            <span aria-hidden="true" className="h-8 w-1.5 rounded-full" style={{ background: ACCENT[g.tradition] }} />
            {trad[g.tradition]}
          </h2>
          {g.regions.map((r) => (
            <div key={r.region} className="mb-6">
              {g.regions.length > 1 || r.region !== "india" ? (
                <h3 className="mb-3 flex items-center gap-2 text-small font-semibold uppercase tracking-wide text-text-muted">
                  <Icon name="MapPin" size={16} />
                  {s(`stories.region.${r.region}`)}
                </h3>
              ) : null}
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {r.stories.map((st) => (
                  <StoryCard key={st.id} st={st} locale={locale} s={s} tradLabel={trad[st.tradition] ?? st.tradition} />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
      <p className="text-small text-text-muted">{s("stories.versions")}</p>
    </div>
  );
}

function Picture({ im, priority }: { im: StoryView["images"][number]; priority?: boolean }) {
  return (
    <figure className="overflow-hidden rounded-2xl bg-[#2A1408] shadow-elev-2">
      <img
        src={im.src}
        alt={im.caption.text}
        lang={im.caption.lang}
        width={im.w}
        height={im.h}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="mx-auto max-h-[70vh] w-auto object-contain"
      />
      <figcaption className="bg-surface px-4 py-2 text-small text-text-muted">
        <T t={im.caption} />
      </figcaption>
    </figure>
  );
}

export function StoryDetail({
  st,
  all,
  locale,
  strings,
  trad,
  placeName,
  festivalName,
}: {
  st: StoryView;
  all: StoryView[];
  locale: Locale;
  strings: Record<string, string>;
  trad: Record<string, string>;
  placeName?: string;
  festivalName?: string;
}) {
  const s = makeS(strings, locale);
  const more = [
    ...all.filter((x) => x.id !== st.id && x.region === st.region && x.tradition === st.tradition),
    ...all.filter((x) => x.id !== st.id && !(x.region === st.region && x.tradition === st.tradition)),
  ].slice(0, 3);
  const lead = st.images[0]!;
  return (
    <article className="wide flex flex-col gap-8">
      <Link href={storyRoutes.list(locale)} className="inline-flex min-h-11 items-center gap-1 self-start text-primary underline underline-offset-2">
        <Icon name="ArrowLeft" size={16} />
        {s("stories.back")}
      </Link>

      <header className="brand-earth brand-glow relative isolate -mx-4 grid gap-6 overflow-hidden px-5 py-8 text-white sm:mx-0 sm:rounded-[var(--r-xl)] sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
        <Mandala className="slow-spin absolute -right-24 -top-24 -z-10 h-[360px] w-[360px] text-[#F3C35B] opacity-20" />
        <div className="min-w-0">
          <p className="flex flex-wrap gap-2">
            <span className="rounded-full px-3 py-1 text-small font-semibold text-white" style={{ background: ACCENT[st.tradition] }}>
              {trad[st.tradition]}
            </span>
            <span className="glass rounded-full px-3 py-1 text-small text-white">{s(`stories.region.${st.region}`)}</span>
          </p>
          <p className="mt-4 text-[1.125rem] font-semibold text-[#F5B22E]">
            <T t={st.figure} />
          </p>
          <h1 className="font-display text-[2.375rem] font-semibold leading-tight text-white sm:text-[3rem]">
            <T t={st.title} />
          </h1>
          <p className="mt-2 max-w-xl text-[1.125rem] text-[#F3E4CC]">
            <T t={st.teaser} />
          </p>
        </div>
        <img
          src={lead.src}
          alt={lead.caption.text}
          width={lead.w}
          height={lead.h}
          className="mx-auto max-h-[420px] w-auto rounded-2xl object-contain shadow-elev-2 ring-4 ring-[#F5B22E]/40"
        />
      </header>

      <ol className="flex flex-col gap-8" data-testid="story-scenes">
        {st.scenes.map((sc, i) => {
          // Picture 0 is already shown in the header.
          const im = sc.image ? st.images[sc.image] : undefined;
          return (
            <li key={i} className={`grid items-center gap-5 ${im ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,0.8fr)]"}`}>
              <div className={`min-w-0 ${im && i % 2 === 1 ? "lg:order-2" : ""}`}>
                <p className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="brand-saffron flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-[1.25rem] font-bold text-white"
                  >
                    {i + 1}
                  </span>
                  <span className="text-small font-semibold uppercase tracking-wide text-text-muted">{s("stories.scene", { n: i + 1 })}</span>
                </p>
                <h2 className="mt-2 font-display text-[1.75rem] font-semibold leading-tight">
                  <T t={sc.title} />
                </h2>
                <p className="mt-2 text-[1.125rem] leading-relaxed">
                  <T t={sc.text} />
                </p>
              </div>
              {im ? <Picture im={im} /> : null}
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="st-lesson" className="brand-gold relative isolate overflow-hidden rounded-[var(--r-xl)] p-6 shadow-elev-1 sm:p-8">
        <h2 id="st-lesson" className="flex items-center gap-2 font-display text-[1.625rem] font-semibold">
          <Icon name="Sparkle" size={22} />
          {s("stories.lesson")}
        </h2>
        <p className="mt-2 font-display text-[1.5rem] leading-snug">
          <T t={st.lesson} />
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="st-src" className="rounded-[var(--r-xl)] border border-divider bg-surface p-5">
          <h2 id="st-src" className="font-display text-[1.375rem] font-semibold">
            {s("stories.source")}
          </h2>
          <p className="mt-1">
            <T t={st.source} />
          </p>
          <p className="mt-2 text-small text-text-muted">{s("stories.versions")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {st.place && placeName ? (
              <Link
                href={yatraRoutes.detail(locale, st.place)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-tint px-4 text-small font-semibold text-on-primary-tint hover:bg-primary hover:text-on-primary"
              >
                <Icon name="MapPin" size={16} />
                {s("stories.visit")} · {placeName}
              </Link>
            ) : null}
            {st.festival && festivalName ? (
              <Link
                href={festivalRoutes.detail(locale, st.festival)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-tint px-4 text-small font-semibold text-on-primary-tint hover:bg-primary hover:text-on-primary"
              >
                <Icon name="Flame" size={16} />
                {s("stories.festival")} · {festivalName}
              </Link>
            ) : null}
          </div>
        </section>
        <section aria-labelledby="st-credits" className="rounded-[var(--r-xl)] border border-divider bg-surface p-5">
          <h2 id="st-credits" className="font-display text-[1.375rem] font-semibold">
            {s("stories.credits")}
          </h2>
          <ul className="mt-1 flex flex-col gap-1 text-small" data-testid="story-credits">
            {st.images.map((im) => (
              <li key={im.src}>
                <a href={im.source} target="_blank" rel="noopener noreferrer" lang="en" className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
                  {im.credit}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="st-more">
        <h2 id="st-more" className="mb-4 font-display text-[1.75rem] font-semibold">
          {s("stories.more")}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((x) => (
            <StoryCard key={x.id} st={x} locale={locale} s={s} tradLabel={trad[x.tradition] ?? x.tradition} />
          ))}
        </ul>
      </section>
    </article>
  );
}

/** Entry card for the Practice page and the festival guide. */
export function StoriesLink({ locale, strings }: { locale: Locale; strings: Record<string, string> }) {
  const s = makeS(strings, locale);
  return (
    <li className="flex">
      <Link href={storyRoutes.list(locale)} className="tile group flex min-h-[13rem] flex-1 flex-col justify-end gap-1 bg-[#2A1408] p-6 text-white shadow-elev-2">
        <img src="/stories/ramayana/1.webp" alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover object-top" />
        <span aria-hidden="true" className="photo-shade absolute inset-0 -z-10" />
        <span aria-hidden="true" className="glass mb-auto flex h-11 w-11 items-center justify-center rounded-full">
          <Icon name="Quotes" size={22} />
        </span>
        <span className="block font-display text-[1.625rem] font-semibold leading-tight">{s("stories.title")}</span>
        <span className="line-clamp-2 text-small text-[#F3E4CC]">{s("stories.entry")}</span>
      </Link>
    </li>
  );
}

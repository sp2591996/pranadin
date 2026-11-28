/* eslint-disable @next/next/no-img-element -- static export, server-rendered pictures with fixed sizes */
/**
 * Story collections (D-040). Server components only: no JavaScript is sent.
 * List: collections ("clubs") grouped by faith. Collection: intro + chapters by part.
 * Chapter: picture-led scenes, verse, pause-and-reflect, lesson, previous/next, credits.
 */
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Mandala } from "@/components/Mandala";
import { formatMessage } from "@/features/shared/format-message";
import { festivalRoutes } from "@/features/festivals/routes";
import { yatraRoutes } from "@/features/yatra/routes";
import type { Locale } from "@/i18n/config";
import { clubGroups, storyRoutes, type ClubView, type StoryView, type Txt } from "./content.server";

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

/** Scene text: paragraphs are separated by a blank line. */
const Paras = ({ t }: { t: Txt }) => (
  <div lang={t.lang} className="flex flex-col gap-4 text-[1.125rem] leading-[1.7]">
    {t.text.split(/\n\s*\n/).map((p, i) => (
      <p key={i}>{p}</p>
    ))}
  </div>
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

const cover = (c: ClubView) => c.cover;

function ClubCard({ c, locale, s }: { c: ClubView; locale: Locale; s: S }) {
  const img = cover(c);
  return (
    <li className="flex">
      <Link
        href={storyRoutes.club(locale, c.id)}
        className="card-lift group relative flex aspect-[3/4] flex-1 flex-col justify-end overflow-hidden rounded-2xl bg-[#2A1408] text-white shadow-elev-2"
      >
        <img
          src={img.src}
          alt=""
          width={img.w}
          height={img.h}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        <span aria-hidden="true" className="photo-shade absolute inset-0" />
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5" style={{ background: ACCENT[c.tradition] }} />
        <span className="absolute right-2 top-3.5 flex flex-col items-end gap-1">
          <span className="glass rounded-full px-2.5 py-0.5 text-caption font-semibold text-white">{s("stories.chapters", { count: c.chapters.length })}</span>
          {c.growing ? <span className="rounded-full bg-[#F5B22E] px-2.5 py-0.5 text-caption font-semibold text-[#2A1408]">{s("stories.growing")}</span> : null}
        </span>
        <span className="relative flex flex-col gap-0.5 p-3">
          <span className="font-display text-[1.25rem] font-semibold leading-tight text-white">
            <T t={c.title} />
          </span>
          <span className="line-clamp-2 text-small font-semibold text-[#F5B22E]">
            <T t={c.subtitle} />
          </span>
        </span>
      </Link>
    </li>
  );
}

const CARD_GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function StoryList({ clubs, locale, strings, trad }: { clubs: ClubView[]; locale: Locale; strings: Record<string, string>; trad: Record<string, string> }) {
  const s = makeS(strings, locale);
  const groups = clubGroups(clubs);
  const ram = clubs.find((c) => c.id === "ramayana");
  const hero = ram ? [3, 9, 14].map((i) => ram.chapters[i]?.images[0]).filter(Boolean) : [];
  return (
    <div className="wide flex flex-col gap-8">
      <header className="brand-earth brand-glow relative isolate -mx-4 grid items-center gap-6 overflow-hidden px-5 py-6 text-white sm:mx-0 sm:rounded-[var(--r-xl)] sm:px-8 sm:py-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <Mandala className="slow-spin absolute -left-24 -top-24 -z-10 h-[340px] w-[340px] text-[#F3C35B] opacity-20" />
        <div className="min-w-0">
          <p className="font-deva text-[1.125rem] text-[#F5B22E]" lang="hi" aria-hidden="true">
            {strings["stories.deva"]}
          </p>
          <h1 className="font-display text-[2rem] font-semibold leading-tight text-white sm:text-[3rem]">{s("stories.title")}</h1>
          <p className="mt-1 max-w-xl text-[#F3E4CC]">{s("stories.intro")}</p>
          <p className="mt-3 text-small font-semibold text-[#F3D9A4]">{s("stories.count", { count: clubs.length })}</p>
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
            <span className="font-normal text-text-muted">({g.clubs.length})</span>
          </a>
        ))}
      </nav>

      {groups.map((g) => (
        <section key={g.tradition} id={`tr-${g.tradition}`} aria-labelledby={`h-${g.tradition}`} className="scroll-mt-24">
          <h2 id={`h-${g.tradition}`} className="mb-4 flex items-center gap-3 font-display text-[2rem] font-semibold leading-tight">
            <span aria-hidden="true" className="h-8 w-1.5 rounded-full" style={{ background: ACCENT[g.tradition] }} />
            {trad[g.tradition]}
          </h2>
          <ul className={CARD_GRID}>
            {[...g.clubs].sort((x, y) => Number(!!x.growing) - Number(!!y.growing)).map((c) => (
              <ClubCard key={c.id} c={c} locale={locale} s={s} />
            ))}
          </ul>
        </section>
      ))}
      <p className="text-small text-text-muted">{s("stories.versions")}</p>
    </div>
  );
}

function ChapterRow({ st, locale, s }: { st: StoryView; locale: Locale; s: S }) {
  const img = st.images[0]!;
  void s;
  return (
    <li>
      <Link
        href={storyRoutes.chapter(locale, st.club, st.id)}
        className="group flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-divider bg-surface p-2 pr-3 hover:border-primary"
      >
        <span className="brand-saffron flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[1.0625rem] font-bold text-white">{st.n}</span>
        <img src={img.src} alt="" width={img.w} height={img.h} loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-lg bg-[#2A1408] object-cover object-top" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-display text-[1.125rem] font-semibold leading-tight group-hover:text-primary">
            <T t={st.title} />
          </span>
          <span className="truncate text-small text-text-muted">
            <T t={st.figure} />
          </span>
        </span>
        <Icon name="ArrowRight" size={18} className="shrink-0 text-primary" />
      </Link>
    </li>
  );
}

export function ClubPage({ c, clubs, locale, strings, trad }: { c: ClubView; clubs: ClubView[]; locale: Locale; strings: Record<string, string>; trad: Record<string, string> }) {
  const s = makeS(strings, locale);
  const img = cover(c);
  const first = c.chapters[0]!;
  const sections = c.parts.length
    ? c.parts.map((p) => ({ id: p.id, title: p.title as Txt | undefined, chapters: c.chapters.filter((x) => x.part === p.id) })).filter((p) => p.chapters.length)
    : [{ id: "all", title: undefined, chapters: c.chapters }];
  const more = clubs.filter((x) => x.id !== c.id).sort((a, b) => Number(b.tradition === c.tradition) - Number(a.tradition === c.tradition)).slice(0, 4);
  return (
    <div className="wide flex flex-col gap-8">
      <Link href={storyRoutes.list(locale)} className="inline-flex min-h-11 items-center gap-1 self-start text-primary underline underline-offset-2">
        <Icon name="ArrowLeft" size={16} />
        {s("stories.back")}
      </Link>

      <header className="brand-earth brand-glow relative isolate -mx-4 flex gap-4 overflow-hidden px-4 py-5 text-white sm:mx-0 sm:gap-8 sm:rounded-[var(--r-xl)] sm:p-8">
        <Mandala className="slow-spin absolute -right-24 -top-24 -z-10 h-[360px] w-[360px] text-[#F3C35B] opacity-20" />
        <img src={img.src} alt={img.caption.text} width={img.w} height={img.h} className="aspect-[3/4] w-24 shrink-0 self-start rounded-xl object-cover object-top shadow-elev-2 ring-2 ring-[#F5B22E]/40 sm:w-[220px]" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap gap-1.5">
            <span className="rounded-full px-2.5 py-0.5 text-caption font-semibold text-white" style={{ background: ACCENT[c.tradition] }}>
              {trad[c.tradition]}
            </span>
            <span className="glass rounded-full px-2.5 py-0.5 text-caption text-white">{s(`stories.region.${c.region}`)}</span>
            <span className="glass rounded-full px-2.5 py-0.5 text-caption text-white">{s("stories.chapters", { count: c.chapters.length })}</span>
          </p>
          <h1 className="mt-2 font-display text-[1.75rem] font-semibold leading-tight text-white sm:text-[3rem]">
            <T t={c.title} />
          </h1>
          <p className="text-[1rem] font-semibold text-[#F5B22E] sm:text-[1.25rem]">
            <T t={c.subtitle} />
          </p>
          <p className="mt-2 hidden max-w-xl text-[1.0625rem] text-[#F3E4CC] sm:block">
            <T t={c.intro} />
          </p>
          <div className="mt-5 hidden flex-wrap items-center gap-3 sm:flex">
            <Link
              href={storyRoutes.chapter(locale, c.id, first.id)}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#F5B22E] px-6 font-semibold text-[#2A1408] shadow-elev-2 hover:bg-[#FFC94D]"
            >
              <Icon name="Notebook" size={20} />
              {s("stories.start")}
            </Link>
            {c.growing ? <span className="text-small text-[#F3D9A4]">{s("stories.growing")}</span> : null}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:hidden">
        <p className="text-[1.0625rem] text-text-muted">
          <T t={c.intro} />
        </p>
        <Link
          href={storyRoutes.chapter(locale, c.id, first.id)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F5B22E] px-6 font-semibold text-[#2A1408] shadow-elev-2 hover:bg-[#FFC94D]"
        >
          <Icon name="Notebook" size={20} />
          {s("stories.start")}
        </Link>
      </div>

      {c.parts.length > 1 ? (
        <nav aria-label={s("stories.contents")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {sections.map((p) => (
            <a key={p.id} href={`#part-${p.id}`} className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border-input bg-surface px-4 text-small font-semibold hover:border-primary">
              {p.title ? <T t={p.title} /> : null}
            </a>
          ))}
        </nav>
      ) : null}

      <section aria-labelledby="club-contents" className="flex flex-col gap-6">
        <h2 id="club-contents" className="sr-only">
          {s("stories.contents")}
        </h2>
        {sections.map((p) => (
          <div key={p.id} id={`part-${p.id}`} className="scroll-mt-24">
            {p.title ? (
              <h2 className="mb-3 flex items-center gap-3 font-display text-[1.75rem] font-semibold leading-tight">
                <span aria-hidden="true" className="h-7 w-1.5 rounded-full" style={{ background: ACCENT[c.tradition] }} />
                <T t={p.title} />
              </h2>
            ) : null}
            <ol className="grid grid-cols-1 gap-2 lg:grid-cols-2" data-testid="club-chapters">
              {p.chapters.map((st) => (
                <ChapterRow key={st.id} st={st} locale={locale} s={s} />
              ))}
            </ol>
          </div>
        ))}
      </section>

      <MoreClubs clubs={more} locale={locale} s={s} />
    </div>
  );
}

function MoreClubs({ clubs, locale, s }: { clubs: ClubView[]; locale: Locale; s: S }) {
  return (
    <section aria-labelledby="st-more">
      <h2 id="st-more" className="mb-4 font-display text-[1.75rem] font-semibold">
        {s("stories.more")}
      </h2>
      <ul className={CARD_GRID}>
        {clubs.map((x) => (
          <ClubCard key={x.id} c={x} locale={locale} s={s} />
        ))}
      </ul>
    </section>
  );
}

function Picture({ im }: { im: StoryView["images"][number] }) {
  return (
    <figure className="mx-auto mt-5 max-w-3xl overflow-hidden rounded-2xl bg-[#2A1408] shadow-elev-2">
      <img
        src={im.src}
        alt={im.caption.text}
        lang={im.caption.lang}
        width={im.w}
        height={im.h}
        loading="lazy"
        decoding="async"
        className="mx-auto max-h-[70vh] w-auto max-w-full object-contain"
      />
      <figcaption className="bg-surface px-4 py-2 text-small text-text-muted">
        <T t={im.caption} />
      </figcaption>
    </figure>
  );
}

function NavCard({ st, dir, locale, s }: { st: StoryView; dir: "prev" | "next"; locale: Locale; s: S }) {
  const img = st.images[0]!;
  return (
    <Link
      href={storyRoutes.chapter(locale, st.club, st.id)}
      rel={dir}
      className={`card-lift group flex min-h-24 flex-1 items-center gap-3 overflow-hidden rounded-2xl border border-divider bg-surface p-3 shadow-elev-1 ${dir === "next" ? "flex-row-reverse text-right" : ""}`}
    >
      <img src={img.src} alt="" width={img.w} height={img.h} loading="lazy" decoding="async" className="h-20 w-20 shrink-0 rounded-xl object-cover object-top" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`flex items-center gap-1 text-small font-semibold text-primary ${dir === "next" ? "justify-end" : ""}`}>
          {dir === "prev" ? <Icon name="ArrowLeft" size={16} /> : null}
          {s(dir === "prev" ? "stories.prev" : "stories.next")}
          {dir === "next" ? <Icon name="ArrowRight" size={16} /> : null}
        </span>
        <span className="font-display text-[1.25rem] font-semibold leading-tight">
          <T t={st.title} />
        </span>
      </span>
    </Link>
  );
}

export function ChapterPage({
  c,
  st,
  clubs,
  locale,
  strings,
  placeName,
  festivalName,
}: {
  c: ClubView;
  st: StoryView;
  clubs: ClubView[];
  locale: Locale;
  strings: Record<string, string>;
  trad: Record<string, string>;
  placeName?: string;
  festivalName?: string;
}) {
  const s = makeS(strings, locale);
  const lead = st.images[0]!;
  const prev = c.chapters[st.n - 2];
  const next = c.chapters[st.n];
  const part = c.parts.find((p) => p.id === st.part);
  const total = c.chapters.length;
  return (
    <article className="wide flex flex-col gap-8">
      <Link href={storyRoutes.club(locale, c.id)} className="mx-auto inline-flex min-h-11 w-full max-w-[68ch] items-center gap-1 text-primary underline underline-offset-2">
        <Icon name="ArrowLeft" size={16} />
        <T t={c.title} /> · {s("stories.backClub")}
      </Link>

      <header className="mx-auto w-full max-w-[68ch]">
        {total > 1 ? (
          <div>
            <p className="text-small font-semibold uppercase tracking-wide text-text-muted">
              {s("stories.chapterOf", { n: st.n, total })}
              {part ? (
                <>
                  {" "}
                  · <T t={part.title} />
                </>
              ) : null}
            </p>
            <div aria-hidden="true" className="mt-1.5 h-1 overflow-hidden rounded-full bg-divider">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(st.n / total) * 100}%` }} />
            </div>
          </div>
        ) : null}
        <p className="mt-4 text-[1.0625rem] font-semibold text-primary">
          <T t={st.figure} />
        </p>
        <h1 className="font-display text-[2rem] font-semibold leading-tight sm:text-[2.75rem]">
          <T t={st.title} />
        </h1>
        <p className="mt-2 text-[1.125rem] italic text-text-muted">
          <T t={st.teaser} />
        </p>
      </header>

      <figure className="mx-auto w-full max-w-[68ch] overflow-hidden rounded-2xl bg-[#2A1408] shadow-elev-2">
        <img src={lead.src} alt={lead.caption.text} width={lead.w} height={lead.h} className="mx-auto max-h-[70vh] w-auto max-w-full object-contain" />
        <figcaption className="bg-surface px-4 py-2 text-small text-text-muted">
          <T t={lead.caption} />
        </figcaption>
      </figure>

      <ol className="flex flex-col gap-10" data-testid="story-scenes">
        {st.scenes.map((sc, i) => {
          // Picture 0 is already shown in the header.
          const im = sc.image ? st.images[sc.image] : undefined;
          return (
            <li key={i}>
              <div className="mx-auto max-w-[68ch]">
                <p className="text-small font-semibold uppercase tracking-wide text-primary">{s("stories.scene", { n: i + 1 })}</p>
                <h2 className="mb-3 mt-1 font-display text-[1.625rem] font-semibold leading-tight">
                  <T t={sc.title} />
                </h2>
                <Paras t={sc.text} />
              </div>
              {im ? <Picture im={im} /> : null}
            </li>
          );
        })}
      </ol>

      {st.verse ? (
        <section aria-labelledby="st-verse" className="brand-earth relative isolate mx-auto w-full max-w-[68ch] overflow-hidden rounded-[var(--r-xl)] p-6 text-center text-white shadow-elev-2 sm:p-8">
          <Mandala className="absolute -bottom-20 -right-20 -z-10 h-[260px] w-[260px] text-[#F3C35B] opacity-15" />
          <h2 id="st-verse" className="flex items-center justify-center gap-2 text-small font-semibold uppercase tracking-wide text-[#F5B22E]">
            <Icon name="Quotes" size={18} />
            {s("stories.verse")}
          </h2>
          <p lang={st.verse.lang} className="mt-3 whitespace-pre-line font-deva text-[1.375rem] leading-relaxed text-[#FBE7C0] sm:text-[1.625rem]">
            {st.verse.text}
          </p>
          <p className="mt-3 text-[1.125rem] text-white">
            <T t={st.verse.meaning} />
          </p>
          <p className="mt-2 text-small text-[#F3D9A4]">
            <T t={st.verse.cite} />
          </p>
        </section>
      ) : null}

      <div className="mx-auto flex w-full max-w-[68ch] flex-col gap-5">
        {st.reflect ? (
          <section aria-labelledby="st-reflect" className="rounded-[var(--r-xl)] border-2 border-dashed border-primary/40 bg-primary-tint p-6 text-on-primary-tint sm:p-8">
            <h2 id="st-reflect" className="flex items-center gap-2 font-display text-[1.625rem] font-semibold">
              <Icon name="FlowerLotus" size={22} />
              {s("stories.reflect")}
            </h2>
            <p className="mt-2 text-[1.125rem] leading-relaxed">
              <T t={st.reflect} />
            </p>
          </section>
        ) : null}
        <section aria-labelledby="st-lesson" className={`brand-gold relative isolate overflow-hidden rounded-[var(--r-xl)] p-6 shadow-elev-1 sm:p-8 `}>
          <h2 id="st-lesson" className="flex items-center gap-2 font-display text-[1.625rem] font-semibold">
            <Icon name="Sparkle" size={22} />
            {s("stories.lesson")}
          </h2>
          <p className="mt-2 font-display text-[1.5rem] leading-snug">
            <T t={st.lesson} />
          </p>
        </section>
      </div>

      <nav aria-label={s("stories.contents")} className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row" data-testid="chapter-nav">
        {prev ? <NavCard st={prev} dir="prev" locale={locale} s={s} /> : null}
        {next ? (
          <NavCard st={next} dir="next" locale={locale} s={s} />
        ) : (
          <Link
            href={storyRoutes.club(locale, c.id)}
            className="flex min-h-24 flex-1 flex-col justify-center gap-1 rounded-2xl border border-divider bg-surface p-4 text-right shadow-elev-1 hover:border-primary"
          >
            <span className="text-small text-text-muted">{s("stories.end")}</span>
            <span className="font-display text-[1.25rem] font-semibold text-primary">
              <T t={c.title} /> · {s("stories.backClub")}
            </span>
          </Link>
        )}
      </nav>

      <div className="mx-auto grid w-full max-w-3xl gap-5 text-small sm:grid-cols-2">
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

      {!next ? <MoreClubs clubs={clubs.filter((x) => x.id !== c.id).slice(0, 4)} locale={locale} s={s} /> : null}
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

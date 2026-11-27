"use client";

/** Yoga landing page: pose library with level filter, guided sessions and programmes. */
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/icons.generated";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { btn, card } from "@/features/shared/ui";
import { EnglishMark } from "@/components/ObservanceBody";
import { minutesOf } from "./logic";
import { loadAllProgress } from "./store";
import { summarize } from "./logic";
import { yogaRoutes } from "./routes";
import { SafetyList } from "./SafetyNotice";
import { POSE_LEVELS, type ModuleListItem, type PoseLevel, type PoseListItem, type ProgramListItem } from "./types";
import type { YogaProgress } from "@/lib/types";
import { SectionHeader } from "@/components/SectionHeader";

type Tab = "poses" | "sessions" | "programs";
const TABS: Tab[] = ["poses", "sessions", "programs"];

const FOCUS_LOOK: Record<string, string> = {
  Energy: "brand-saffron",
  Calm: "brand-earth",
  Flexibility: "brand-maroon",
  Strength: "brand-maroon",
  Sleep: "brand-earth",
};

/** A picture tile with a clear Start button (D-038): colour by focus, big minutes, pose picture. */
function Tile({
  href,
  title,
  titleLang,
  image,
  look,
  big,
  meta,
  cta,
  badge,
  progress,
}: {
  href: string;
  title: string;
  titleLang: string;
  image: string | null;
  look: string;
  big: string;
  meta: string;
  cta: string;
  badge?: string;
  progress?: number;
}) {
  return (
    <li className="flex">
      <Link
        href={href}
        className="card-lift group flex flex-1 flex-col overflow-hidden rounded-2xl border border-divider bg-surface shadow-elev-1"
      >
        <span className={`${look} relative isolate flex h-36 items-end overflow-hidden p-4 text-white`}>
          {image ? (
            <span className="absolute -right-2 top-2 -z-10 h-36 w-36 overflow-hidden rounded-full bg-[#F3EEE6] ring-4 ring-white/20 transition-transform duration-500 group-hover:scale-105">
              <Image src={`/yoga/${image}`} alt="" fill sizes="144px" className="object-contain" />
            </span>
          ) : null}
          {badge ? (
            <span className="absolute left-3 top-3 rounded-full bg-[#F5B22E] px-2.5 py-0.5 text-caption font-bold text-[#35180A]">
              {badge}
            </span>
          ) : null}
          <span className="font-display text-[2rem] font-bold leading-none text-white drop-shadow">{big}</span>
        </span>
        <span className="flex flex-1 flex-col gap-2 p-4">
          <span className="font-display text-[1.3125rem] font-semibold leading-tight">
            <span lang={titleLang}>{title}</span>
            {titleLang === "en" ? <EnglishMark /> : null}
          </span>
          <span className="text-small text-text-muted">{meta}</span>
          {progress !== undefined ? (
            <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-2">
              <span className="brand-saffron block h-full rounded-full" style={{ width: `${Math.round(progress * 100)}%` }} />
            </span>
          ) : null}
          <span className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full bg-primary px-5 font-semibold text-on-primary transition-colors group-hover:bg-primary-pressed">
            {cta}
            <Icon name="ArrowRight" size={16} />
          </span>
        </span>
      </Link>
    </li>
  );
}

const LEVEL_TAG: Record<string, string> = {
  beginner: "bg-[#FFF4E0] text-[#6A240B]",
  intermediate: "bg-[#F4CB86] text-[#3A1A0B]",
  advanced: "bg-[#5E1A10] text-[#FFF4E0]",
};

function PoseCard({ p, href, levelLabel, catLabel, aiLabel }: { p: PoseListItem; href: string; levelLabel: string; catLabel: string; aiLabel: string }) {
  return (
    <li className="flex">
      <Link href={href} className="card-lift group flex flex-1 flex-col overflow-hidden rounded-2xl border border-divider bg-surface shadow-elev-1">
        <span className="relative block aspect-square overflow-hidden bg-[#F3EEE6]">
          <Image src={`/yoga/${p.image}`} alt="" fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-contain transition-transform duration-500 group-hover:scale-[1.03]" />
          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-caption font-semibold ${LEVEL_TAG[p.level.toLowerCase()] ?? "bg-surface text-text"}`}>{levelLabel}</span>
          <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.75rem] font-medium text-white">{aiLabel}</span>
        </span>
        <span className="flex flex-1 flex-col p-4">
          <span className="font-display text-[1.375rem] font-semibold leading-tight">
            <span lang={p.nameLang}>{p.name}</span>
            {p.nameLang === "en" ? <EnglishMark /> : null}
          </span>
          <span className="mt-0.5 font-display text-[1.0625rem] italic text-primary">{p.sanskrit}</span>
          <span className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-caption font-medium text-text-muted">{catLabel}</span>
            <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-primary-tint text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
              <Icon name="ArrowRight" size={16} />
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

export function YogaHome({ poses, modules, programs }: { poses: PoseListItem[]; modules: ModuleListItem[]; programs: ProgramListItem[] }) {
  const s = useS();
  const { locale } = useI18n();
  const [tab, setTab] = useState<Tab>("poses");
  const [level, setLevel] = useState<PoseLevel | "all">("all");
  const [progress, setProgress] = useState<Record<string, YogaProgress>>({});

  useEffect(() => {
    let alive = true;
    void loadAllProgress().then((p) => alive && setProgress(p));
    return () => {
      alive = false;
    };
  }, []);

  const shown = poses.filter((p) => level === "all" || p.level === level);
  const imageOf = (slug: string | undefined) => modules.find((m) => m.slug === slug)?.image ?? null;
  // "Start here": a programme in progress, else the shortest beginner programme.
  const going = programs.find((p) => {
    const x = summarize(progress[p.id], p.days.length);
    return x.done > 0 && !x.finished;
  });
  const first = going ?? [...programs].filter((p) => p.level === "Beginner").sort((a, b) => a.days.length - b.days.length)[0] ?? programs[0];
  const firstSum = first ? summarize(progress[first.id], first.days.length) : null;
  const avgMin = first ? Math.round(first.days.reduce((a, d) => a + d.seconds, 0) / first.days.length / 60) : 0;
  const quick = [...modules].filter((m) => m.level === "Beginner").sort((a, b) => a.seconds - b.seconds)[0] ?? modules[0];
  const TAB_ICON: Record<Tab, IconName> = { poses: "FlowerLotus", sessions: "PersonSimpleTaiChi", programs: "CalendarHeart" };
  const counts: Record<Tab, number> = { poses: poses.length, sessions: modules.length, programs: programs.length };

  return (
    <div className="wide flex flex-col gap-6">
      <SectionHeader deva="योगाभ्यास" title={s("yoga.title")} intro={s("yoga.intro")} />

      {first && firstSum ? (
        <section
          aria-labelledby="yoga-start"
          className="brand-earth brand-glow relative isolate grid items-center gap-5 overflow-hidden rounded-[var(--r-xl)] p-5 text-white shadow-elev-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-8"
        >
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[#F5B22E] px-3 py-1 text-small font-bold text-[#35180A]">
              <Icon name="Sparkle" size={14} />
              {s("yoga.startHere")}
            </p>
            <h2 id="yoga-start" className="mt-3 font-display text-[1.875rem] font-semibold leading-tight text-white sm:text-[2.25rem]">
              {going ? s("yoga.hero.contTitle", { title: first.title }) : s("yoga.hero.newTitle", { title: first.title })}
            </h2>
            <p className="mt-1 max-w-xl text-[#F3E4CC]">
              {going
                ? s("yoga.prog.progress", { done: firstSum.done, total: firstSum.total })
                : s("yoga.hero.newSub", { count: first.days.length, minutes: avgMin })}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={yogaRoutes.program(locale, first.id)}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#F5B22E] px-6 font-semibold text-[#35180A] shadow-elev-1 hover:bg-[#F8C04D]"
              >
                {going ? s("yoga.prog.continue", { n: firstSum.next ?? 1 }) : s("yoga.prog.start", { n: 1 })}
                <Icon name="ArrowRight" size={18} />
              </Link>
              {quick ? (
                <Link
                  href={yogaRoutes.session(locale, quick.slug)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 px-4 text-small font-semibold text-white hover:bg-white/10"
                >
                  <Icon name="Timer" size={16} />
                  <span>
                    {s("yoga.hero.quick", { title: quick.title })} · {s("yoga.minutes", { minutes: minutesOf(quick.seconds) })}
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
          {imageOf(first.days[0]?.module) ? (
            <span className="relative hidden h-44 w-44 overflow-hidden rounded-full bg-[#F3EEE6] ring-8 ring-white/10 sm:block">
              <Image src={`/yoga/${imageOf(first.days[0]?.module)}`} alt="" fill sizes="176px" className="object-contain" />
            </span>
          ) : null}
        </section>
      ) : null}

      <details className={`${card} mx-auto w-full max-w-3xl`}>
        <summary className="min-h-11 cursor-pointer font-semibold">{s("yoga.safety.title")}</summary>
        <div className="mt-2">
          <SafetyList />
        </div>
      </details>

      <div role="group" aria-label={s("yoga.tabs.label")} className="mx-auto grid w-full max-w-2xl grid-cols-3 gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-divider bg-surface px-2 py-2 font-semibold text-text-muted transition-colors hover:border-primary aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary aria-[pressed=true]:text-on-primary aria-[pressed=true]:shadow-elev-1 sm:flex-row sm:gap-2"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            <Icon name={TAB_ICON[t]} size={20} />
            <span>{s(`yoga.tab.${t}`)}</span>
            <span className="text-caption font-normal opacity-80">({counts[t]})</span>
          </button>
        ))}
      </div>

      {tab === "poses" ? (
        <section aria-labelledby="poses-h" className="flex flex-col gap-3">
          <h2 id="poses-h" className="sr-only">
            {s("yoga.tab.poses")}
          </h2>
          <div role="group" aria-label={s("yoga.level.label")} className="flex flex-wrap justify-center gap-2">
            {(["all", ...POSE_LEVELS] as const).map((l) => (
              <button key={l} type="button" className={btn.chip} aria-pressed={level === l} onClick={() => setLevel(l)}>
                {s(l === "all" ? "yoga.level.all" : `yoga.level.${l}`)}
              </button>
            ))}
          </div>
          <p className="text-center text-small text-text-muted" role="status">
            {s("yoga.count", { count: shown.length })}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="pose-list">
            {shown.map((p) => (
              <PoseCard key={p.slug} p={p} href={yogaRoutes.pose(locale, p.slug)} levelLabel={s(`yoga.level.${p.level}`)} catLabel={s(`yoga.cat.${p.category}`)} aiLabel={s("yoga.aiImage")} />
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "sessions" ? (
        <section aria-labelledby="sessions-h" className="flex flex-col gap-3">
          <h2 id="sessions-h" className="sr-only">
            {s("yoga.tab.sessions")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="session-list">
            {modules.map((m) => (
              <Tile
                key={m.slug}
                href={yogaRoutes.session(locale, m.slug)}
                title={m.title}
                titleLang={m.titleLang}
                image={m.image}
                look={FOCUS_LOOK[m.focus] ?? "brand-earth"}
                big={s("yoga.minutes", { minutes: minutesOf(m.seconds) })}
                badge={m.slug === quick?.slug ? s("yoga.recommended") : undefined}
                meta={`${s(`yoga.focus.${m.focus}`)} · ${s(`yoga.level.${m.level}`)} · ${s("yoga.stepsCount", { count: m.steps })} · ${s(`yoga.time.${m.timeOfDay}`)}`}
                cta={s("yoga.cta.start")}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "programs" ? (
        <section aria-labelledby="programs-h" className="flex flex-col gap-3">
          <h2 id="programs-h" className="sr-only">
            {s("yoga.tab.programs")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="program-list">
            {programs.map((p, i) => {
              const sum = summarize(progress[p.id], p.days.length);
              return (
                <Tile
                  key={p.id}
                  href={yogaRoutes.program(locale, p.id)}
                  title={p.title}
                  titleLang={p.titleLang}
                  image={imageOf(p.days[0]?.module)}
                  look={["brand-saffron", "brand-maroon", "brand-earth"][i % 3]!}
                  big={s("yoga.prog.days", { count: p.days.length })}
                  badge={p.id === first?.id ? s("yoga.startHere") : undefined}
                  meta={`${s(`yoga.level.${p.level}`)} · ${s("yoga.prog.progress", { done: sum.done, total: sum.total })}`}
                  progress={sum.done / Math.max(1, sum.total)}
                  cta={sum.finished ? s("yoga.prog.open") : sum.done ? s("yoga.prog.continue", { n: sum.next ?? 1 }) : s("yoga.prog.begin")}
                />
              );
            })}
          </ul>
        </section>
      ) : null}

    </div>
  );
}

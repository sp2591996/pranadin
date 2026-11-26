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

function Row({ href, title, titleLang, sub, icon }: { href: string; title: string; titleLang: string; sub: string; icon: IconName }) {
  return (
    <li className="flex">
      <Link href={href} className="card-lift flex flex-1 items-start gap-4 rounded-2xl border border-divider bg-surface p-5 shadow-elev-1">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
          <Icon name={icon} size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[1.25rem] font-semibold leading-tight">
            <span lang={titleLang}>{title}</span>
            {titleLang === "en" ? <EnglishMark /> : null}
          </span>
          <span className="mt-1 block text-small text-text-muted">{sub}</span>
        </span>
      </Link>
    </li>
  );
}

const LEVEL_TAG: Record<string, string> = {
  beginner: "bg-success-tint text-success",
  intermediate: "bg-warning-tint text-warning",
  advanced: "bg-error-tint text-error",
};

function PoseCard({ p, href, levelLabel, catLabel, aiLabel }: { p: PoseListItem; href: string; levelLabel: string; catLabel: string; aiLabel: string }) {
  return (
    <li className="flex">
      <Link href={href} className="card-lift flex flex-1 flex-col overflow-hidden rounded-2xl border border-divider bg-surface shadow-elev-1">
        <span className="relative block aspect-[4/3] overflow-hidden bg-surface-2">
          <Image src={`/yoga/${p.image}`} alt="" fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-caption font-semibold ${LEVEL_TAG[p.level] ?? "bg-surface text-text"}`}>{levelLabel}</span>
          <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.75rem] font-medium text-white">{aiLabel}</span>
        </span>
        <span className="flex flex-1 flex-col p-4">
          <span className="font-display text-[1.375rem] font-semibold leading-tight">
            <span lang={p.nameLang}>{p.name}</span>
            {p.nameLang === "en" ? <EnglishMark /> : null}
          </span>
          <span className="mt-0.5 font-display text-[1.0625rem] italic text-primary">{p.sanskrit}</span>
          <span className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-caption font-medium text-text-muted">{catLabel}</span>
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

  return (
    <div className="wide flex flex-col gap-6">
      <SectionHeader deva="योगाभ्यास" title={s("yoga.title")} intro={s("yoga.intro")} />

      <details className={`${card} mx-auto w-full max-w-3xl`}>
        <summary className="min-h-11 cursor-pointer font-semibold">{s("yoga.safety.title")}</summary>
        <div className="mt-2">
          <SafetyList />
        </div>
      </details>

      <div role="group" aria-label={s("yoga.tabs.label")} className="mx-auto flex flex-wrap justify-center gap-1 rounded-full border border-divider bg-surface-2 p-1">
        {TABS.map((t) => (
          <button key={t} type="button" className="inline-flex min-h-11 items-center rounded-full px-5 font-semibold text-text-muted transition-colors aria-[pressed=true]:bg-surface aria-[pressed=true]:text-primary aria-[pressed=true]:shadow-elev-1" aria-pressed={tab === t} onClick={() => setTab(t)}>
            {s(`yoga.tab.${t}`)}
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
              <Row
                icon="PersonSimpleTaiChi"
                key={m.slug}
                href={yogaRoutes.session(locale, m.slug)}
                title={m.title}
                titleLang={m.titleLang}
                sub={`${s(`yoga.level.${m.level}`)} · ${s("yoga.minutes", { minutes: minutesOf(m.seconds) })} · ${s("yoga.stepsCount", { count: m.steps })} · ${s(`yoga.focus.${m.focus}`)}`}
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
            {programs.map((p) => {
              const sum = summarize(progress[p.id], p.days.length);
              return (
                <Row
                  icon="CalendarHeart"
                  key={p.id}
                  href={yogaRoutes.program(locale, p.id)}
                  title={p.title}
                  titleLang={p.titleLang}
                  sub={`${s(`yoga.level.${p.level}`)} · ${s("yoga.prog.days", { count: p.days.length })} · ${s("yoga.prog.progress", { done: sum.done, total: sum.total })}`}
                />
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

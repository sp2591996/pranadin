"use client";

/** Yoga landing page: pose library with level filter, guided sessions and programmes. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
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

type Tab = "poses" | "sessions" | "programs";
const TABS: Tab[] = ["poses", "sessions", "programs"];

function Row({ href, title, titleLang, sub }: { href: string; title: string; titleLang: string; sub: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-surface-2">
        <span className="flex-1">
          <span className="block font-semibold">
            <span lang={titleLang}>{title}</span>
            {titleLang === "en" ? <EnglishMark /> : null}
          </span>
          <span className="block text-[0.875rem] leading-5 text-text-muted">{sub}</span>
        </span>
        <CaretRightIcon size={20} aria-hidden="true" className="text-text-muted" />
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
    <div className="flex flex-col gap-5">
      <div>
        <h1>{s("yoga.title")}</h1>
        <p className="text-text-muted">{s("yoga.intro")}</p>
      </div>

      <details className={card}>
        <summary className="min-h-11 cursor-pointer font-semibold">{s("yoga.safety.title")}</summary>
        <div className="mt-2">
          <SafetyList />
        </div>
      </details>

      <div role="group" aria-label={s("yoga.tabs.label")} className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} type="button" className={btn.chip} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {s(`yoga.tab.${t}`)}
          </button>
        ))}
      </div>

      {tab === "poses" ? (
        <section aria-labelledby="poses-h" className="flex flex-col gap-3">
          <h2 id="poses-h" className="sr-only">
            {s("yoga.tab.poses")}
          </h2>
          <div role="group" aria-label={s("yoga.level.label")} className="flex flex-wrap gap-2">
            {(["all", ...POSE_LEVELS] as const).map((l) => (
              <button key={l} type="button" className={btn.chip} aria-pressed={level === l} onClick={() => setLevel(l)}>
                {s(l === "all" ? "yoga.level.all" : `yoga.level.${l}`)}
              </button>
            ))}
          </div>
          <p className="text-[0.875rem] leading-5 text-text-muted" role="status">
            {s("yoga.count", { count: shown.length })}
          </p>
          <ul className="divide-y divide-divider rounded-lg border border-divider bg-surface" data-testid="pose-list">
            {shown.map((p) => (
              <Row
                key={p.slug}
                href={yogaRoutes.pose(locale, p.slug)}
                title={p.name}
                titleLang={p.nameLang}
                sub={`${p.sanskrit} · ${s(`yoga.level.${p.level}`)} · ${s(`yoga.cat.${p.category}`)}`}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "sessions" ? (
        <section aria-labelledby="sessions-h" className="flex flex-col gap-3">
          <h2 id="sessions-h" className="sr-only">
            {s("yoga.tab.sessions")}
          </h2>
          <ul className="divide-y divide-divider rounded-lg border border-divider bg-surface" data-testid="session-list">
            {modules.map((m) => (
              <Row
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
          <ul className="divide-y divide-divider rounded-lg border border-divider bg-surface" data-testid="program-list">
            {programs.map((p) => {
              const sum = summarize(progress[p.id], p.days.length);
              return (
                <Row
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

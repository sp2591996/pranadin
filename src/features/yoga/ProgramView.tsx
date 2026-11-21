"use client";

/** One programme: day-by-day list with progress saved on this device. */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { btn, card, ConfirmDialog } from "@/features/shared/ui";
import { EnglishMark } from "@/components/ObservanceBody";
import { minutesOf, summarize } from "./logic";
import { yogaRoutes } from "./routes";
import { loadProgress, resetProgram, setDay } from "./store";
import type { ProgramListItem } from "./types";
import type { YogaProgress } from "@/lib/types";

export function ProgramView({ program }: { program: ProgramListItem }) {
  const s = useS();
  const { locale } = useI18n();
  const total = program.days.length;
  const [progress, setProgress] = useState<YogaProgress | undefined>(undefined);
  const [saved, setSaved] = useState(true);
  const [confirm, setConfirm] = useState(false);

  const refresh = useCallback(() => {
    void loadProgress(program.id).then((r) => {
      setProgress(r.progress);
      setSaved(r.saved);
    });
  }, [program.id]);

  useEffect(() => {
    refresh();
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const sum = summarize(progress, total);
  const done = new Set(progress?.days ?? []);

  const toggleDay = async (day: number) => {
    const p = await setDay(program.id, day, total, !done.has(day));
    setProgress(p);
  };

  return (
    <div className="flex flex-col gap-5">
      <Link href={yogaRoutes.home(locale)} className="inline-flex min-h-11 items-center gap-1 text-primary">
        <CaretLeftIcon size={18} aria-hidden="true" />
        {s("yoga.prog.back")}
      </Link>
      <header>
        <h1>
          <span lang={program.titleLang}>{program.title}</span>
          {program.titleLang === "en" ? <EnglishMark /> : null}
        </h1>
        <p className="text-text-muted" lang="en">
          {program.description}
        </p>
        <p className="mt-1 text-text-muted">
          {s(`yoga.level.${program.level}`)} · {s("yoga.prog.days", { count: total })}
        </p>
      </header>

      <section className={card} aria-labelledby="prog-progress-h">
        <h2 id="prog-progress-h" data-testid="prog-progress">
          {s("yoga.prog.progress", { done: sum.done, total })}
        </h2>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
          <div className="h-full bg-primary" style={{ width: `${(sum.done / total) * 100}%` }} />
        </div>
        {sum.finished ? (
          <p className="mt-3 font-semibold" role="status">
            {s("yoga.prog.finished")}
          </p>
        ) : sum.next ? (
          <Link
            href={yogaRoutes.session(locale, program.days[sum.next - 1]!.module, { id: program.id, day: sum.next })}
            className={`${btn.primary} mt-3`}
          >
            {sum.done === 0 ? s("yoga.prog.start", { n: sum.next }) : s("yoga.prog.continue", { n: sum.next })}
          </Link>
        ) : null}
        <p className="mt-3 text-[0.875rem] leading-5 text-text-muted">{saved ? s("yoga.prog.saved") : s("yoga.prog.notSaved")}</p>
      </section>

      <section aria-labelledby="days-h">
        <h2 id="days-h">{s("yoga.prog.list")}</h2>
        <ol className="divide-y divide-divider rounded-lg border border-divider bg-surface" data-testid="day-list">
          {program.days.map((d) => {
            const isDone = done.has(d.day);
            return (
              <li key={d.day} className="flex flex-wrap items-center gap-3 px-4 py-3" data-done={isDone}>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    {s("yoga.prog.day", { n: d.day })}
                    {isDone ? (
                      <span className="ms-2 inline-flex items-center gap-1 text-text-muted">
                        <CheckCircleIcon size={18} weight="fill" aria-hidden="true" />
                        {s("yoga.prog.done")}
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-[0.875rem] leading-5 text-text-muted" lang={program.titleLang === "en" ? "en" : locale}>
                    {d.moduleTitle} · {s("yoga.minutes", { minutes: minutesOf(d.seconds) })}
                  </span>
                </span>
                <Link href={yogaRoutes.session(locale, d.module, { id: program.id, day: d.day })} className={btn.ghost}>
                  {s("yoga.prog.start", { n: d.day })}
                </Link>
                <button type="button" className={btn.ghost} onClick={() => void toggleDay(d.day)}>
                  {isDone ? s("yoga.prog.undo", { n: d.day }) : s("yoga.prog.markDone", { n: d.day })}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {sum.done > 0 ? (
        <button type="button" className={`${btn.secondary} self-start`} onClick={() => setConfirm(true)}>
          {s("yoga.prog.restart")}
        </button>
      ) : null}
      <ConfirmDialog
        open={confirm}
        title={s("yoga.prog.restartTitle")}
        body={s("yoga.prog.restartBody")}
        confirmLabel={s("yoga.prog.restart")}
        cancelLabel={s("common.cancel")}
        danger
        onConfirm={() => {
          setConfirm(false);
          void resetProgram(program.id).then(() => setProgress(undefined));
        }}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}

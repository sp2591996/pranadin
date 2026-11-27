"use client";

/** One programme: day-by-day list with progress saved on this device. */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { btn, ConfirmDialog } from "@/features/shared/ui";
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
    <div className="wide flex flex-col gap-6">
      <Link
        href={yogaRoutes.home(locale)}
        className="inline-flex min-h-11 items-center gap-1 self-start text-primary"
      >
        <CaretLeftIcon size={18} aria-hidden="true" />
        {s("yoga.prog.back")}
      </Link>
      <header className="brand-maroon brand-glow relative isolate -mx-4 grid gap-6 overflow-hidden px-5 py-8 text-white sm:mx-0 sm:rounded-[var(--r-xl)] sm:px-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <p className="text-small font-semibold text-[#F3D9A4]">
            {s(`yoga.level.${program.level}`)} ·{" "}
            {s("yoga.prog.days", { count: total })}
          </p>
          <h1 className="mt-1 font-display text-[2.25rem] font-semibold leading-tight text-white sm:text-[2.75rem]">
            <span lang={program.titleLang}>{program.title}</span>
            {program.titleLang === "en" ? <EnglishMark onDark /> : null}
          </h1>
          <p className="mt-1 max-w-xl text-[#F3E4CC]" lang={program.titleLang}>
            {program.description}
          </p>
        </div>
        <section
          className="glass rounded-[var(--r-xl)] p-5 lg:col-span-5"
          aria-labelledby="prog-progress-h"
        >
          <h2
            id="prog-progress-h"
            data-testid="prog-progress"
            className="font-display text-[1.5rem] font-semibold text-white"
          >
            {s("yoga.prog.progress", { done: sum.done, total })}
          </h2>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-[#F5B22E]"
              style={{ width: `${Math.round((sum.done / total) * 100)}%` }}
            />
          </div>
          {sum.finished ? (
            <p className="mt-3 font-semibold" role="status">
              {s("yoga.prog.finished")}
            </p>
          ) : sum.next ? (
            <Link
              href={yogaRoutes.session(
                locale,
                program.days[sum.next - 1]!.module,
                { id: program.id, day: sum.next },
              )}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#F5B22E] px-6 font-semibold text-[#35180A] hover:bg-[#F8C04D]"
            >
              {sum.done === 0
                ? s("yoga.prog.start", { n: sum.next })
                : s("yoga.prog.continue", { n: sum.next })}
            </Link>
          ) : null}
          <p className="mt-3 text-[0.875rem] leading-5 text-[#F3E4CC]">
            {saved ? s("yoga.prog.saved") : s("yoga.prog.notSaved")}
          </p>
        </section>
      </header>

      <section aria-labelledby="days-h">
        <h2
          id="days-h"
          className="mb-3 font-display text-[1.625rem] font-semibold"
        >
          {s("yoga.prog.list")}
        </h2>
        <ol
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          data-testid="day-list"
        >
          {program.days.map((d) => {
            const isDone = done.has(d.day);
            const isNext = sum.next === d.day;
            return (
              <li
                key={d.day}
                className={`flex flex-col gap-2 rounded-2xl border bg-surface p-4 shadow-elev-1 ${isNext ? "border-primary ring-2 ring-primary-tint" : "border-divider"}`}
                data-done={isDone}
              >
                <span className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-[1.125rem] font-bold ${isDone ? "brand-saffron text-white" : "bg-primary-tint text-on-primary-tint"}`}
                  >
                    {isDone ? (
                      <CheckCircleIcon size={22} weight="fill" />
                    ) : (
                      d.day
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {s("yoga.prog.day", { n: d.day })}
                      {isDone ? (
                        <span className="ms-2 text-small font-normal text-text-muted">
                          {s("yoga.prog.done")}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="block text-[0.875rem] leading-5 text-text-muted"
                      lang={program.titleLang === "en" ? "en" : locale}
                    >
                      {d.moduleTitle} ·{" "}
                      {s("yoga.minutes", { minutes: minutesOf(d.seconds) })}
                    </span>
                  </span>
                </span>
                <span className="flex flex-wrap gap-1">
                  <Link
                    href={yogaRoutes.session(locale, d.module, {
                      id: program.id,
                      day: d.day,
                    })}
                    className={btn.ghost}
                  >
                    {s("yoga.prog.start", { n: d.day })}
                  </Link>
                  <button
                    type="button"
                    className={btn.ghost}
                    onClick={() => void toggleDay(d.day)}
                  >
                    {isDone
                      ? s("yoga.prog.undo", { n: d.day })
                      : s("yoga.prog.markDone", { n: d.day })}
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {sum.done > 0 ? (
        <button
          type="button"
          className={`${btn.secondary} self-start`}
          onClick={() => setConfirm(true)}
        >
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

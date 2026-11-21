"use client";

/**
 * Guided yoga session: timed steps with next/previous, pause, a voice-free
 * on-screen cue, a soft bell between poses and Wake Lock where available.
 */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { PauseIcon } from "@phosphor-icons/react/dist/csr/Pause";
import { PlayIcon } from "@phosphor-icons/react/dist/csr/Play";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { useDeviceValue } from "@/features/shared/use-device";
import { btn, card, ConfirmDialog } from "@/features/shared/ui";
import { EnglishMark } from "@/components/ObservanceBody";
import { bell, suspendAudio, unlockAudio } from "@/features/practice/audio";
import { formatClock, SessionClock } from "@/features/practice/engine";
import { useOnHidden, useSessionKeys, useWakeLock } from "@/features/practice/hooks";
import { readSound, writeSound } from "@/features/practice/store";
import { countsAsDone, CUE_LEAD_SEC, initialState, jump, minutesOf, moduleSeconds, practisedTotalMs, tick, type StepClockState } from "./logic";
import { programId, yogaRoutes } from "./routes";
import { SafetyGate } from "./SafetyNotice";
import { setDay } from "./store";
import { YogaImage } from "./YogaImage";
import type { ModuleListItem, YogaModule } from "./types";

type Phase = "ready" | "running" | "paused" | "complete";

export interface ProgramRef {
  id: string;
  title: string;
  titleLang: string;
  /** Module slug for each day, in order. */
  modules: string[];
}

export interface PoseRef {
  name: string;
  nameLang: string;
  image: string;
  alt: string;
}

interface Result {
  minutes: number;
  counted: boolean;
  saved: boolean;
  program: { ref: ProgramRef; day: number } | null;
}

function readProgramQuery(programs: ProgramRef[], slug: string): { ref: ProgramRef; day: number } | null {
  try {
    const q = new URLSearchParams(window.location.search);
    const ref = programs.find((p) => p.id === programId(q.get("prog") ?? ""));
    const day = Number(q.get("day"));
    if (!ref || !Number.isInteger(day) || day < 1 || day > ref.modules.length || ref.modules[day - 1] !== slug) return null;
    return { ref, day };
  } catch {
    return null;
  }
}

export function SessionPlayer({
  module,
  item,
  poses,
  programs,
}: {
  module: YogaModule;
  item: ModuleListItem;
  poses: Record<string, PoseRef>;
  programs: ProgramRef[];
}) {
  const s = useS();
  const { locale } = useI18n();
  const steps = module.steps;
  const planned = moduleSeconds(steps);
  const [phase, setPhase] = useState<Phase>("ready");
  const [st, setSt] = useState<StepClockState>(initialState);
  const [chime, setChime] = useDeviceValue(() => readSound().chime, true);
  const [prog] = useDeviceValue(() => readProgramQuery(programs, module.slug), null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const clock = useRef(new SessionClock());
  const stRef = useRef<StepClockState>(initialState);
  const chimeRef = useRef(chime);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    chimeRef.current = chime;
  });
  useEffect(() => () => suspendAudio(), []);

  const apply = useCallback((next: StepClockState) => {
    stRef.current = next;
    setSt(next);
  }, []);

  const ring = useCallback(() => {
    if (chimeRef.current) bell();
  }, []);

  const finish = useCallback(
    async (final: StepClockState, natural: boolean) => {
      clock.current.pause();
      apply(final);
      setConfirmEnd(false);
      setPhase("complete");
      if (natural) ring();
      const practised = practisedTotalMs(final);
      const counted = countsAsDone(practised, planned);
      setResult({ minutes: Math.max(1, Math.round(practised / 60_000)), counted, saved: true, program: prog });
      if (counted && prog) {
        const saved = await setDay(prog.ref.id, prog.day, prog.ref.modules.length, true);
        if (!saved) setResult((r) => (r ? { ...r, saved: false } : r));
      }
    },
    [apply, planned, prog, ring],
  );

  const onTick = useCallback(() => {
    if (!clock.current.running) return;
    const adv = tick(steps, stRef.current, clock.current.elapsed());
    if (adv.done) {
      void finish(adv.state, true);
      return;
    }
    if (adv.changed) {
      clock.current.start();
      ring();
    }
    apply(adv.state);
  }, [apply, finish, ring, steps]);

  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(onTick, 250);
    return () => window.clearInterval(id);
  }, [phase, onTick]);

  useEffect(() => {
    if (phase === "complete") heading.current?.focus();
  }, [phase]);

  const start = useCallback(() => {
    void unlockAudio();
    apply(initialState);
    clock.current.start();
    setPhase("running");
    ring();
  }, [apply, ring]);

  const pause = useCallback(() => {
    if (!clock.current.running) return;
    clock.current.pause();
    setPhase("paused");
  }, []);
  const resume = useCallback(() => {
    clock.current.resume();
    setPhase("running");
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      const cur = stRef.current;
      const j = jump(steps, { ...cur, stepMs: Math.min(clock.current.elapsed(), steps[cur.index]!.seconds * 1000) }, dir);
      if (j.done) {
        void finish(j.state, false);
        return;
      }
      apply(j.state);
      const wasPaused = !clock.current.running;
      clock.current.start();
      if (wasPaused) clock.current.pause();
    },
    [apply, finish, steps],
  );

  const askEnd = useCallback(() => {
    pause();
    setConfirmEnd(true);
  }, [pause]);

  const active = phase === "running" || phase === "paused";
  useWakeLock(phase === "running");
  useOnHidden(pause);
  useSessionKeys(active, () => (clock.current.running ? pause() : resume()), askEnd);

  const step = steps[st.index]!;
  const pose = step.pose ? poses[step.pose] : undefined;
  const remainingMs = Math.max(0, step.seconds * 1000 - st.stepMs);
  const next = steps[st.index + 1];
  const cueNow = active && !!next && remainingMs <= CUE_LEAD_SEC * 1000;
  const back = prog ? yogaRoutes.program(locale, prog.ref.id) : yogaRoutes.home(locale);

  const toggleChime = () => {
    const v = !chime;
    setChime(v);
    writeSound({ ...readSound(), chime: v });
  };

  if (phase === "complete" && result) {
    return (
      <section aria-labelledby="yoga-done-h" className="flex flex-col items-center gap-4 py-6 text-center">
        <h1 id="yoga-done-h" ref={heading} tabIndex={-1} className="focus:outline-none">
          {s("yoga.session.done")}
        </h1>
        <p>{s("yoga.session.doneBody")}</p>
        {result.counted && result.program ? (
          <p role="status" className="font-semibold">
            {s("yoga.session.doneProgram", { name: result.program.ref.title, day: result.program.day })}
          </p>
        ) : null}
        {!result.counted && result.program ? <p role="status">{s("yoga.session.doneShort", { minutes: result.minutes })}</p> : null}
        {result.program && !result.saved ? <p className="text-text-muted">{s("yoga.prog.notSaved")}</p> : null}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className={btn.secondary}
            onClick={() => {
              setPhase("ready");
              setResult(null);
              apply(initialState);
            }}
          >
            {s("yoga.session.again")}
          </button>
          <Link href={back} className={btn.primary}>
            {result.program ? s("yoga.session.backProgram") : s("yoga.session.backYoga")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!active ? (
        <Link href={back} className="inline-flex min-h-11 items-center gap-1 text-primary">
          <CaretLeftIcon size={18} aria-hidden="true" />
          {prog ? s("yoga.session.backProgram") : s("yoga.session.backYoga")}
        </Link>
      ) : null}

      {phase === "ready" ? (
        <SafetyGate>
          <header>
            <h1>
              <span lang={item.titleLang}>{item.title}</span>
              {item.titleLang === "en" ? <EnglishMark /> : null}
            </h1>
            {prog ? <p className="text-text-muted">{s("yoga.session.programDay", { name: prog.ref.title, day: prog.day })}</p> : null}
            <p className="text-text-muted">
              {s(`yoga.level.${item.level}`)} · {s("yoga.minutes", { minutes: minutesOf(planned) })} · {s("yoga.stepsCount", { count: steps.length })}
            </p>
          </header>
          <p lang="en">{module.description}</p>
          <button type="button" className={`${btn.primary} self-start`} onClick={start}>
            {s("yoga.session.start")}
          </button>
          <section aria-labelledby="ov-h" className={card}>
            <h2 id="ov-h">{s("yoga.session.overview")}</h2>
            <ol className="list-decimal space-y-1 ps-5" lang="en">
              {steps.map((x) => (
                <li key={x.title}>
                  {x.title} <span className="text-text-muted">({formatClock(x.seconds * 1000)})</span>
                </li>
              ))}
            </ol>
          </section>
        </SafetyGate>
      ) : (
        <>
          <p className="text-center text-[0.875rem] leading-5 text-text-muted">
            {s("yoga.session.stepOf", { n: st.index + 1, total: steps.length })}
            {phase === "paused" ? ` · ${s("yoga.session.paused")}` : ""}
          </p>

          {pose ? <YogaImage file={pose.image} alt={pose.alt} className="max-w-[220px]" /> : null}

          <div className="text-center" lang="en">
            <h1 className="text-[1.5rem] leading-8" data-testid="step-title">
              {step.title}
            </h1>
            <p className="mt-2">{step.instruction}</p>
            <p className="mt-2 text-text-muted">{step.breath}</p>
            {pose ? (
              <p className="mt-1 text-[0.875rem] leading-5 text-text-muted">
                {s("yoga.session.poseGuide")}: <span lang={pose.nameLang}>{pose.name}</span>
              </p>
            ) : null}
          </div>

          <div className="text-center">
            <p className="text-[2.25rem] font-semibold leading-[2.75rem] tabular-nums" aria-hidden="true" data-testid="step-clock">
              {formatClock(remainingMs)}
            </p>
            <div className="mx-auto mt-2 h-2 w-full max-w-[320px] overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, (st.stepMs / (step.seconds * 1000)) * 100)}%` }} />
            </div>
          </div>

          <p
            role="status"
            data-testid="next-cue"
            className={`rounded-lg border-2 px-4 py-3 text-center ${cueNow ? "border-primary bg-primary-tint text-on-primary-tint" : "border-transparent text-text-muted"}`}
          >
            {next ? <span lang="en">{s("yoga.session.upNext", { title: next.title })}</span> : <span>{s("yoga.session.done")}</span>}
          </p>

          <div className="flex items-center justify-center gap-3">
            <button type="button" className={btn.icon} aria-label={s("yoga.session.prev")} onClick={() => go(-1)}>
              <CaretLeftIcon size={24} aria-hidden="true" />
            </button>
            <button type="button" className={btn.primary} onClick={phase === "running" ? pause : resume}>
              {phase === "running" ? <PauseIcon size={20} aria-hidden="true" /> : <PlayIcon size={20} aria-hidden="true" />}
              {phase === "running" ? s("yoga.session.pause") : s("yoga.session.resume")}
            </button>
            <button type="button" className={btn.icon} aria-label={s("yoga.session.next")} onClick={() => go(1)}>
              <CaretRightIcon size={24} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button type="button" role="switch" aria-checked={chime} className={btn.chip} onClick={toggleChime}>
              {chime ? s("yoga.session.bellOn") : s("yoga.session.bellOff")}
            </button>
            <button type="button" className={btn.ghost} onClick={askEnd}>
              {s("yoga.session.end")}
            </button>
          </div>

          <p className="sr-only" role="status" aria-live="polite" lang="en">
            {step.title}. {step.breath}
          </p>
        </>
      )}

      <ConfirmDialog
        open={confirmEnd}
        title={s("yoga.session.endConfirm")}
        body={s("yoga.session.endBody")}
        confirmLabel={s("yoga.session.end")}
        cancelLabel={s("yoga.session.keepGoing")}
        onConfirm={() => void finish({ ...stRef.current, stepMs: Math.min(clock.current.elapsed(), step.seconds * 1000) }, false)}
        onCancel={() => {
          setConfirmEnd(false);
          resume();
        }}
      />
    </div>
  );
}

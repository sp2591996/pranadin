/** Yoga: pure logic for the guided player and programme progress. */
import { COMPLETION_THRESHOLD, type LocalDateKey, type YogaProgress } from "@/lib/types";
import type { ModuleStep } from "./types";

type Timed = Pick<ModuleStep, "seconds">;

export const moduleSeconds = (steps: readonly Timed[]) => steps.reduce((a, s) => a + s.seconds, 0);

/** Whole minutes, never below 1. */
export const minutesOf = (seconds: number) => Math.max(1, Math.round(seconds / 60));

/** Seconds before a step ends when the on-screen "Next" cue appears. */
export const CUE_LEAD_SEC = 5;

export interface StepClockState {
  /** Index of the step now running. */
  index: number;
  /** Ms spent in the current step. */
  stepMs: number;
  /** Ms spent in steps already left behind. */
  practisedMs: number;
}

export const initialState: StepClockState = { index: 0, stepMs: 0, practisedMs: 0 };

export interface Advance {
  state: StepClockState;
  /** The step changed (play the bell). */
  changed: boolean;
  /** The last step has run out. */
  done: boolean;
}

/**
 * Move to `stepMs` in the current step. When a step's time is up, go on to
 * the next (carrying leftover time). `done` is true once the last step ends.
 */
export function tick(steps: readonly Timed[], s: StepClockState, stepMs: number): Advance {
  let index = s.index;
  let ms = stepMs;
  let practised = s.practisedMs;
  let changed = false;
  while (index < steps.length && ms >= steps[index]!.seconds * 1000) {
    ms -= steps[index]!.seconds * 1000;
    practised += steps[index]!.seconds * 1000;
    index += 1;
    changed = true;
  }
  if (index >= steps.length) {
    const last = steps[steps.length - 1]!.seconds * 1000;
    return { state: { index: steps.length - 1, stepMs: last, practisedMs: practised - last }, changed, done: true };
  }
  return { state: { index, stepMs: ms, practisedMs: practised }, changed, done: false };
}

/**
 * Skip to the next or previous step. Time already spent still counts as
 * practised; going back restarts that step's own timer.
 */
export function jump(steps: readonly Timed[], s: StepClockState, dir: 1 | -1): { state: StepClockState; done: boolean } {
  const spent = Math.min(s.stepMs, steps[s.index]!.seconds * 1000);
  const index = s.index + dir;
  if (index < 0) return { state: { ...s, stepMs: 0, practisedMs: s.practisedMs + spent }, done: false };
  if (index >= steps.length) return { state: { index: steps.length - 1, stepMs: 0, practisedMs: s.practisedMs + spent }, done: true };
  return { state: { index, stepMs: 0, practisedMs: s.practisedMs + spent }, done: false };
}

/** Total practised ms, including the step now running. */
export const practisedTotalMs = (s: StepClockState) => s.practisedMs + s.stepMs;

/** A programme day counts when at least 80 % of the session was practised (same rule as breath and stillness). */
export function countsAsDone(practisedMs: number, plannedSeconds: number): boolean {
  return plannedSeconds > 0 && practisedMs >= plannedSeconds * 1000 * COMPLETION_THRESHOLD;
}

// ---------- programme progress ----------

export function emptyProgress(id: string, today: LocalDateKey, now = Date.now()): YogaProgress {
  return { v: 1, id, localDate: today, at: now, startedOn: today, days: [] };
}

/** Mark a day done. Idempotent, keeps days sorted, ignores numbers outside 1..total. */
export function markDay(
  p: YogaProgress | undefined,
  id: string,
  day: number,
  total: number,
  today: LocalDateKey,
  now = Date.now(),
): YogaProgress {
  const base = p ?? emptyProgress(id, today, now);
  if (!Number.isInteger(day) || day < 1 || day > total) return base;
  const days = base.days.includes(day) ? base.days : [...base.days, day].sort((a, b) => a - b);
  return { ...base, days, localDate: today, at: now };
}

export function unmarkDay(p: YogaProgress, day: number, today: LocalDateKey, now = Date.now()): YogaProgress {
  return { ...p, days: p.days.filter((d) => d !== day), localDate: today, at: now };
}

/** The first day not yet done, or null when the programme is finished. */
export function nextDay(p: YogaProgress | undefined, total: number): number | null {
  const done = new Set(p?.days ?? []);
  for (let d = 1; d <= total; d++) if (!done.has(d)) return d;
  return null;
}

export interface ProgressSummary {
  done: number;
  total: number;
  next: number | null;
  finished: boolean;
}

export function summarize(p: YogaProgress | undefined, total: number): ProgressSummary {
  const done = new Set((p?.days ?? []).filter((d) => d >= 1 && d <= total)).size;
  return { done, total, next: nextDay(p, total), finished: done >= total };
}

/**
 * Timing engine for the breath pacer and the meditation timer (DS-5 §1.4).
 * Pure and drift-free: everything is derived from elapsed milliseconds,
 * never from counting interval ticks. The clock takes an injectable `now`
 * so tests can drive it.
 */
import { COMPLETION_THRESHOLD } from "@/lib/types";

export interface PhaseLike {
  seconds: number;
}

export const cycleMs = (pattern: readonly PhaseLike[]) => pattern.reduce((a, p) => a + p.seconds * 1000, 0);

/** Whole rounds closest to the planned minutes; never fewer than 1 (DS-5 §1.2). */
export function roundsFor(pattern: readonly PhaseLike[], plannedSec: number): number {
  const c = cycleMs(pattern);
  if (c <= 0) return 1;
  return Math.max(1, Math.round((plannedSec * 1000) / c));
}

export const sessionMs = (pattern: readonly PhaseLike[], rounds: number) => cycleMs(pattern) * rounds;

export interface BreathPosition {
  done: boolean;
  /** 1-based round. */
  round: number;
  phaseIndex: number;
  phaseMs: number;
  phaseElapsedMs: number;
  /** Whole seconds left in this phase, counting down (e.g. 4, 3, 2, 1). */
  phaseSecondsLeft: number;
  /** Elapsed ms at which this phase began. */
  phaseStartMs: number;
  sessionRemainingMs: number;
}

export function positionAt(pattern: readonly PhaseLike[], rounds: number, elapsedMs: number): BreathPosition {
  const c = cycleMs(pattern);
  const total = c * rounds;
  const e = Math.max(0, elapsedMs);
  if (e >= total || c <= 0) {
    const last = pattern.length - 1;
    return {
      done: true,
      round: rounds,
      phaseIndex: last,
      phaseMs: (pattern[last]?.seconds ?? 0) * 1000,
      phaseElapsedMs: (pattern[last]?.seconds ?? 0) * 1000,
      phaseSecondsLeft: 0,
      phaseStartMs: total - (pattern[last]?.seconds ?? 0) * 1000,
      sessionRemainingMs: 0,
    };
  }
  const roundIdx = Math.floor(e / c);
  let within = e - roundIdx * c;
  let start = roundIdx * c;
  let i = 0;
  for (; i < pattern.length; i++) {
    const ms = pattern[i]!.seconds * 1000;
    if (within < ms) break;
    within -= ms;
    start += ms;
  }
  const phaseMs = pattern[i]!.seconds * 1000;
  return {
    done: false,
    round: roundIdx + 1,
    phaseIndex: i,
    phaseMs,
    phaseElapsedMs: within,
    phaseSecondsLeft: Math.ceil((phaseMs - within) / 1000),
    phaseStartMs: start,
    sessionRemainingMs: total - e,
  };
}

/** PRD §6: a timed practice is complete at >= 80% of the planned time. */
export function isComplete(actualSec: number, plannedSec: number): boolean {
  return plannedSec > 0 && actualSec >= plannedSec * COMPLETION_THRESHOLD;
}

/** Pausable stopwatch driven by timestamps. */
export class SessionClock {
  private base = 0;
  private startedAt = 0;
  private _running = false;

  constructor(private readonly now: () => number = () => performance.now()) {}

  get running(): boolean {
    return this._running;
  }

  elapsed(): number {
    return this._running ? this.base + (this.now() - this.startedAt) : this.base;
  }

  start(): void {
    this.base = 0;
    this.startedAt = this.now();
    this._running = true;
  }

  pause(): void {
    if (!this._running) return;
    this.base = this.elapsed();
    this._running = false;
  }

  /**
   * Resume. `rewindTo` sets the elapsed time first: the breath player passes
   * the start of the current phase so a resumed breath starts cleanly
   * (DS-5 §1.3 Paused).
   */
  resume(rewindTo?: number): void {
    if (this._running) return;
    if (rewindTo !== undefined) this.base = Math.max(0, Math.min(this.base, rewindTo));
    this.startedAt = this.now();
    this._running = true;
  }
}

/** `m:ss` for a number of milliseconds (rounded up to the second). */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

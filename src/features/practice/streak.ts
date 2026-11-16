/**
 * Gentle streak and week dots (FR-6, US-16, US-17). Derived on the device
 * from the practice log; nothing extra is stored.
 *
 * Rules:
 * - A practice day is a local calendar day with >= 1 completed practice.
 * - A single missed day between practice days is bridged by a "rest day"
 *   (grace), at most one per rolling 7 days. Bridged days count in the streak
 *   (Mon practise, Tue rest, Wed practise = 3).
 * - Today never breaks a streak: until midnight the streak runs to yesterday.
 * - Two missed days in a row, or a second miss inside 7 days, starts a new
 *   streak. Total days and minutes are always kept.
 */
import { addDays, parseDateKey, weekday } from "@/i18n/format";
import type { LocalDateKey, PracticeLog } from "@/lib/types";

export type StreakState = "none" | "active" | "grace" | "reset";

export interface Progress {
  streak: number;
  state: StreakState;
  /** Mon..Sun of the current week: true = practice day. */
  weekDots: boolean[];
  /** Date keys for the week dots, Mon..Sun. */
  weekDates: LocalDateKey[];
  weekDays: number;
  totalDays: number;
  totalMinutes: number;
  /** Days since the last practice day (0 = today); null if never. */
  daysSinceLast: number | null;
}

const GRACE_WINDOW_DAYS = 7;

function dayNumber(key: LocalDateKey): number {
  const { y, m, d } = parseDateKey(key);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function mondayOf(key: LocalDateKey): LocalDateKey {
  return addDays(key, -((weekday(key) + 6) % 7));
}

export function practiceDays(logs: readonly PracticeLog[]): Set<LocalDateKey> {
  return new Set(logs.filter((l) => l.completed).map((l) => l.localDate));
}

/** Streak length ending at today (or yesterday, if today has no practice yet). */
export function computeStreak(days: ReadonlySet<LocalDateKey>, today: LocalDateKey): { streak: number; graceDays: LocalDateKey[] } {
  const graces: LocalDateKey[] = [];
  const graceOk = (d: LocalDateKey) => graces.every((g) => Math.abs(dayNumber(g) - dayNumber(d)) >= GRACE_WINDOW_DAYS);

  let anchor: LocalDateKey | null = null;
  let pendingGrace: LocalDateKey | null = null;
  const y1 = addDays(today, -1);
  const y2 = addDays(today, -2);
  if (days.has(today)) anchor = today;
  else if (days.has(y1)) anchor = y1;
  else if (days.has(y2)) {
    anchor = y2;
    pendingGrace = y1; // checked after the walk, against older rest days
  }
  if (!anchor) return { streak: 0, graceDays: [] };

  let earliest = anchor;
  let cur = anchor;
  for (;;) {
    const prev = addDays(cur, -1);
    if (days.has(prev)) {
      cur = earliest = prev;
      continue;
    }
    const prev2 = addDays(cur, -2);
    if (days.has(prev2) && graceOk(prev)) {
      graces.push(prev);
      cur = earliest = prev2;
      continue;
    }
    break;
  }

  let end = anchor;
  if (pendingGrace) {
    if (!graceOk(pendingGrace)) return { streak: 0, graceDays: [] };
    graces.unshift(pendingGrace);
    end = pendingGrace;
  }
  return { streak: dayNumber(end) - dayNumber(earliest) + 1, graceDays: graces };
}

export function computeProgress(logs: readonly PracticeLog[], today: LocalDateKey): Progress {
  const days = practiceDays(logs);
  const { streak, graceDays } = computeStreak(days, today);
  const monday = mondayOf(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const weekDots = weekDates.map((d) => days.has(d));
  const totalSec = logs.filter((l) => l.completed).reduce((a, l) => a + Math.max(0, l.actualSec), 0);
  const sorted = [...days].sort();
  const last = sorted[sorted.length - 1];
  const todayN = dayNumber(today);
  const recentGrace = graceDays.some((g) => todayN - dayNumber(g) < GRACE_WINDOW_DAYS);
  let state: StreakState = "none";
  if (days.size > 0) state = streak === 0 ? "reset" : recentGrace ? "grace" : "active";
  return {
    streak,
    state,
    weekDots,
    weekDates,
    weekDays: weekDots.filter(Boolean).length,
    totalDays: days.size,
    totalMinutes: Math.floor(totalSec / 60),
    daysSinceLast: last ? todayN - dayNumber(last) : null,
  };
}

/**
 * North Star (D-005): this device is a Weekly Practising User for the week
 * starting `monday` if it has 3+ completed sessions of 3+ minutes on 3+
 * distinct days that week.
 */
export function isWpuWeek(logs: readonly PracticeLog[], monday: LocalDateKey): boolean {
  const end = addDays(monday, 6);
  const sessions = logs.filter((l) => l.completed && l.actualSec >= 180 && l.localDate >= monday && l.localDate <= end);
  return sessions.length >= 3 && new Set(sessions.map((l) => l.localDate)).size >= 3;
}

/**
 * Daily 3-step plan (FR-3.2, US-04/07/08/09/17). Pure and deterministic:
 * same goal, minutes and local date give the same plan. Rules come from
 * Content (`content/data/plan-rotation.json`, `content/en/plan-cards.json`).
 */
import { addDays, parseDateKey } from "@/i18n/format";
import type { Goal, JournalEntry, LocalDateKey, PlanMinutes, PracticeLog } from "@/lib/types";

export type StepType = "breath" | "stillness" | "reflection";
export const STEP_TYPES: readonly StepType[] = ["breath", "stillness", "reflection"];

export interface PlanCard {
  id: string;
  type: StepType;
  /** Breath technique or meditation id, e.g. `breath.deergha`, `med.body-scan`. */
  practiceId: string | null;
  /** Journal prompt id for reflection cards. */
  promptId: string | null;
  title: string;
  body: string;
}

export interface PlanContent {
  cards: Record<string, PlanCard>;
  /** goal → 7 days → card id per step type. */
  rotation: Record<string, Record<StepType, string>[]>;
  minutesByBudget: Record<string, Record<StepType, number>>;
  welcomeBack: { type: StepType; card: string; minutes: number }[];
  defaultGoal: Goal;
}

export interface PlanStep {
  n: number;
  type: StepType;
  minutes: number;
  card: PlanCard;
}

const EPOCH = Date.UTC(2026, 0, 1);

export function daysSinceEpoch(localDate: LocalDateKey): number {
  const { y, m, d } = parseDateKey(localDate);
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86_400_000);
}

/** Content rule: dayIndex = (local days since 2026-01-01) mod 7. */
export function dayIndex(localDate: LocalDateKey): number {
  return ((daysSinceEpoch(localDate) % 7) + 7) % 7;
}

/**
 * US-17: welcome back when there has been no practice day in the last 2
 * local days (yesterday and the day before), for someone who has practised
 * before. Today's own practice doesn't count, so the plan stays stable all day.
 */
export function needsWelcomeBack(practiceDays: ReadonlySet<LocalDateKey>, today: LocalDateKey): boolean {
  const before = [...practiceDays].filter((d) => d < today);
  if (before.length === 0) return false;
  return !practiceDays.has(addDays(today, -1)) && !practiceDays.has(addDays(today, -2));
}

export function buildPlan(
  content: PlanContent,
  goal: Goal,
  minutes: PlanMinutes,
  today: LocalDateKey,
  welcomeBack = false,
): PlanStep[] {
  if (welcomeBack && content.welcomeBack.length > 0) {
    return content.welcomeBack
      .filter((s) => content.cards[s.card])
      .map((s, i) => ({ n: i + 1, type: s.type, minutes: s.minutes, card: content.cards[s.card]! }));
  }
  const days = content.rotation[goal] ?? content.rotation[content.defaultGoal] ?? [];
  const day = days[dayIndex(today) % Math.max(1, days.length)];
  const budget = content.minutesByBudget[String(minutes)] ?? content.minutesByBudget["10"];
  if (!day || !budget) return [];
  return STEP_TYPES.filter((t) => content.cards[day[t]]).map((t, i) => ({
    n: i + 1,
    type: t,
    minutes: budget[t],
    card: content.cards[day[t]]!,
  }));
}

/** Which step types are done today: a completed timed practice, or a journal line (PRD §6). */
export function doneToday(logs: readonly PracticeLog[], entries: readonly JournalEntry[], today: LocalDateKey): Set<StepType> {
  const done = new Set<StepType>();
  for (const l of logs) {
    if (l.localDate === today && l.completed && (l.kind === "breath" || l.kind === "stillness")) done.add(l.kind);
  }
  if (entries.some((e) => e.localDate === today)) done.add("reflection");
  return done;
}

/** URL slug for a practice id: `breath.deergha` → `deergha`. */
export const slugOf = (practiceId: string) => practiceId.replace(/^[a-z]+\./, "");

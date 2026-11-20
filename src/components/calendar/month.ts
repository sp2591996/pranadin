/** Month-grid helpers for the Calendar tab. Pure (no time zones: date keys only). */
import { addDays, parseDateKey, weekday } from "@/i18n/format";
import type { LocalDateKey } from "@/lib/types";

/** `YYYY-MM` */
export type MonthKey = string;

export const monthOf = (d: LocalDateKey): MonthKey => d.slice(0, 7);

export function shiftMonth(m: MonthKey, delta: number): MonthKey {
  const { y, m: mm } = parseDateKey(`${m}-01`);
  const t = new Date(Date.UTC(y, mm - 1 + delta, 1));
  return t.toISOString().slice(0, 7);
}

/**
 * Weeks (Mon..Sun, the Indian convention used across the app) covering the
 * month, including leading and trailing days of the neighbouring months.
 */
export function monthGrid(m: MonthKey): LocalDateKey[][] {
  const first = `${m}-01`;
  let d = addDays(first, -((weekday(first) + 6) % 7));
  const weeks: LocalDateKey[][] = [];
  do {
    const week: LocalDateKey[] = [];
    for (let i = 0; i < 7; i++, d = addDays(d, 1)) week.push(d);
    weeks.push(week);
  } while (monthOf(d) === m);
  return weeks;
}

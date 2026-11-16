/**
 * Observance queries (E-06). Pure and client-safe; the table itself is
 * loaded at build time by `loadObservances()` in `src/content/load.ts`.
 * Dates are calendar dates (IST basis per Content); a user abroad sees the
 * same calendar date in their own day (FR-9 AC).
 */
import { addDays } from "@/i18n/format";
import type { LocalDateKey } from "./types";

export interface DatedItem {
  date: LocalDateKey;
  endDate: LocalDateKey | null;
}

/** True if the item is on `day` (inclusive range for multi-day items). */
export function isOn(item: DatedItem, day: LocalDateKey): boolean {
  return item.date <= day && day <= (item.endDate ?? item.date);
}

export function observancesOn<T extends DatedItem>(items: readonly T[], day: LocalDateKey): T[] {
  return items.filter((i) => isOn(i, day));
}

/**
 * Items starting in the `days` days after `today` (not including today),
 * grouped by start date, in date order. Multi-day items already running
 * today are not repeated.
 */
export function upcoming<T extends DatedItem>(
  items: readonly T[],
  today: LocalDateKey,
  days = 7,
): { date: LocalDateKey; items: T[] }[] {
  const end = addDays(today, days);
  const groups = new Map<LocalDateKey, T[]>();
  for (const it of items) {
    if (it.date > today && it.date <= end) {
      const g = groups.get(it.date) ?? [];
      g.push(it);
      groups.set(it.date, g);
    }
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, items]) => ({ date, items }));
}

/** Whether a day is inside the verified window (outside it, say so instead of showing "none"). */
export function inWindow(window: { from: LocalDateKey; to: LocalDateKey }, day: LocalDateKey): boolean {
  return window.from <= day && day <= window.to;
}

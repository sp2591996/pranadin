/** Trip planner helpers used only by the planner page (D-037), kept apart from plan-logic so place pages stay small. */
import type { PlanDay, TripItem } from "./plan-logic";
import type { PlaceView } from "./types";

/** Ready-made trips (D-037). Ids that are missing from the content are skipped. */
export const STARTERS: { id: string; items: TripItem[] }[] = [
  { id: "kashi", items: [{ placeId: "varanasi", days: 2 }, { placeId: "sarnath", days: 1 }] },
  { id: "punjab", items: [{ placeId: "amritsar", days: 2 }, { placeId: "anandpur-sahib", days: 1 }] },
  { id: "buddha", items: [{ placeId: "bodh-gaya", days: 2 }, { placeId: "sarnath", days: 1 }, { placeId: "kushinagar", days: 1 }] },
  { id: "tamil", items: [{ placeId: "madurai", days: 2 }, { placeId: "rameswaram", days: 1 }, { placeId: "kanchipuram", days: 1 }] },
  { id: "himalaya", items: [{ placeId: "haridwar", days: 1 }, { placeId: "rishikesh", days: 2 }, { placeId: "kedarnath", days: 2 }] },
];

/** `YYYY-MM-DD` plus n days (calendar arithmetic in UTC, no time-zone drift). Null for a bad key. */
export function addDaysKey(key: string, n: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]! + n, 12));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Places whose dated days fall in a "difficult" season, once per place and month. */
export function seasonWarnings(plan: PlanDay[], places: PlaceView[], start: string): { placeId: string; placeName: string; month: number }[] {
  const out: { placeId: string; placeName: string; month: number }[] = [];
  for (const d of plan) {
    const key = addDaysKey(start, d.dayNo - 1);
    if (!key) return [];
    const month = Number(key.slice(5, 7));
    const place = places.find((p) => p.id === d.placeId);
    const rating = place?.seasons.find((x) => x.months.includes(month))?.rating;
    if (rating === "difficult" && !out.some((w) => w.placeId === d.placeId && w.month === month)) out.push({ placeId: d.placeId, placeName: d.placeName, month });
  }
  return out;
}

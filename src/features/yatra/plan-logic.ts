/** Trip planner logic (pure, unit-tested). A trip is an ordered list of places with 1, 2 or 3 days each. */
import type { BudgetBand, DayPart, PlaceView, Range } from "./types";

export type TripDays = 1 | 2 | 3;
export interface TripItem {
  placeId: string;
  days: TripDays;
}
export const MAX_ITEMS = 12;

export interface PlanDay {
  dayNo: number;
  placeId: string;
  placeName: string;
  placeDay: number;
  ofDays: number;
  parts: { part: DayPart; text: string }[];
}

const asDays = (n: unknown): TripDays => (n === 2 || n === 3 ? n : 1);

/** Keep only known places, one entry per place, valid day counts. Safe on any stored garbage. */
export function sanitizeItems(raw: unknown, validIds: readonly string[]): TripItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: TripItem[] = [];
  for (const r of raw) {
    const id = (r as { placeId?: unknown } | null)?.placeId;
    if (typeof id !== "string" || !validIds.includes(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ placeId: id, days: asDays((r as { days?: unknown }).days) });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

export function addPlace(items: TripItem[], placeId: string, days: TripDays = 1): TripItem[] {
  return items.some((i) => i.placeId === placeId) || items.length >= MAX_ITEMS ? items : [...items, { placeId, days }];
}
export const removePlace = (items: TripItem[], placeId: string): TripItem[] => items.filter((i) => i.placeId !== placeId);
export const setDays = (items: TripItem[], placeId: string, days: TripDays): TripItem[] =>
  items.map((i) => (i.placeId === placeId ? { ...i, days } : i));
export function movePlace(items: TripItem[], placeId: string, dir: -1 | 1): TripItem[] {
  const i = items.findIndex((x) => x.placeId === placeId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= items.length) return items;
  const out = [...items];
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}
export const totalDays = (items: TripItem[]) => items.reduce((n, i) => n + i.days, 0);

/** Combined day-by-day plan: each place contributes its itinerary for the chosen number of days. */
export function buildPlan(items: TripItem[], places: PlaceView[]): PlanDay[] {
  const out: PlanDay[] = [];
  for (const it of items) {
    const place = places.find((p) => p.id === it.placeId);
    const itin = place?.itineraries.find((x) => x.days === it.days);
    if (!place || !itin) continue;
    itin.plan.forEach((day, k) =>
      out.push({
        dayNo: out.length + 1,
        placeId: place.id,
        placeName: place.name.text,
        placeDay: k + 1,
        ofDays: it.days,
        parts: day.map((d) => ({ part: d.part, text: d.text.text })),
      }),
    );
  }
  return out;
}

/** Indicative cost range for the whole trip in one budget band (days x per-day range). */
export function estimateBudget(items: TripItem[], places: PlaceView[], band: BudgetBand): Range {
  let min = 0;
  let max = 0;
  for (const it of items) {
    const r = places.find((p) => p.id === it.placeId)?.budget.bands[band];
    if (!r) continue;
    min += r.min * it.days;
    max += r.max * it.days;
  }
  return { min, max };
}

export interface PlanTextLabels {
  title: string;
  day: (n: number, place: string, k: number, of: number) => string;
  part: Record<DayPart, string>;
  footer: string;
}

/** Plain text for copy, share and print. */
export function planToText(plan: PlanDay[], labels: PlanTextLabels): string {
  const lines = [labels.title, ""];
  for (const d of plan) {
    lines.push(labels.day(d.dayNo, d.placeName, d.placeDay, d.ofDays));
    for (const p of d.parts) lines.push(`- ${labels.part[p.part]}: ${p.text}`);
    lines.push("");
  }
  lines.push(labels.footer);
  return lines.join("\n");
}

import { buildLegs, cityPoint, costLines, placePoint, schedule, totalOf, type Choice, type CostLine, type Cover, type Day, type Leg, type Style } from "./trip-engine";
import type { BudgetBand, CityView, PlaceView } from "./types";

export const COVERS: Cover[] = ["darshan", "sights"];
export const STYLES: Style[] = ["cheap", "balanced", "fast"];

export interface TripInput {
  home: CityView;
  stops: { placeId: string; days: 1 | 2 | 3 }[];
  people: number;
  band: BudgetBand;
  cover: Cover;
  style: Style;
  picks: Record<string, Partial<Choice>>;
}
export interface Trip {
  legs: Leg[];
  days: Day[];
  lines: CostLine[];
  total: { min: number; max: number };
}

/** Everything the detailed plan needs, from the trip engine (D-038). */
export function computeTrip(x: TripInput, byId: Map<string, PlaceView>, places: PlaceView[]): Trip {
  const stops = x.stops.filter((s) => byId.has(s.placeId));
  const legs = buildLegs(cityPoint(x.home), stops.map((s) => placePoint(byId.get(s.placeId)!)), x.people, x.style, x.picks);
  const days = schedule(stops, legs, places, x.cover);
  const lines = costLines(days, legs, places, x.people, x.band, x.cover);
  return { legs, days, lines, total: totalOf(lines) };
}

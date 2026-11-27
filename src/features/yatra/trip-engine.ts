/**
 * Trip engine (D-038): distances, travel options per leg, best visiting order,
 * a dated day-by-day schedule and a cost estimate split by component.
 * Pure and unit-tested. All money and times are INDICATIVE: they come from
 * distance and published fare rules (rail per-km bands, typical bus, taxi and
 * airfare levels in 2026), not from live booking data. Nothing is booked.
 */
import type { BudgetBand, PlaceView, Range } from "./types";

export type Mode = "train" | "bus" | "cab" | "flight";
export type TrainClass = "2S" | "SL" | "3A" | "2A" | "1A";
export type BusClass = "ordinary" | "sleeper";
export type Cover = "darshan" | "sights";
export type Style = "cheap" | "balanced" | "fast";
export const MODES: Mode[] = ["train", "bus", "cab", "flight"];
export const TRAIN_CLASSES: TrainClass[] = ["2S", "SL", "3A", "2A", "1A"];
export const BUS_CLASSES: BusClass[] = ["ordinary", "sleeper"];

export interface Point {
  id: string;
  lat: number;
  lon: number;
  /** Has regular flights (a city), or km from the place to its airport. */
  airKm: number | null;
  /** km from the railway station to the place (0 for a city). */
  railKm: number;
}
export interface Choice {
  mode: Mode;
  train: TrainClass;
  bus: BusClass;
}
export interface LegOption {
  mode: Mode;
  km: number;
  /** Door-to-door hours, quiet to busy. */
  hours: Range;
  /** Rupees for the whole group (vehicle hire is per car). */
  cost: Range;
}
export interface Leg {
  key: string;
  from: string;
  to: string;
  km: number;
  options: LegOption[];
  choice: Choice;
  chosen: LegOption;
}

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
/** Straight-line km between two points. */
export function haversine(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const round = (n: number, to = 10) => Math.round(n / to) * to;
const rng = (lo: number, hi: number, to = 10): Range => ({ min: round(lo, to), max: round(Math.max(lo, hi), to) });
const hrs = (lo: number, hi: number): Range => ({ min: Math.max(0.5, Math.round(lo * 2) / 2), max: Math.max(0.5, Math.round(hi * 2) / 2) });

/** Second-class sitting, sleeper, 3AC, 2AC, 1AC: rupees per km and a flat part (reservation, superfast). */
const TRAIN_FARE: Record<TrainClass, [number, number]> = { "2S": [0.3, 30], SL: [0.52, 40], "3A": [1.36, 60], "2A": [1.97, 60], "1A": [3.3, 80] };
const BUS_FARE: Record<BusClass, number> = { ordinary: 1.25, sleeper: 2.1 };
/** Sedan seats 4, SUV 6; rupees per km for a one-way hire, plus driver allowance. */
export const carsFor = (people: number) => Math.max(1, Math.ceil(people / 4));
const lastMile = (km: number, people: number) => (km <= 0 ? 0 : Math.max(150, km * 18) * carsFor(people));

/** All sensible ways to cover one leg, with time and group cost. */
export function legOptions(a: Point, b: Point, people: number, choice: Pick<Choice, "train" | "bus">): LegOption[] {
  const d = haversine(a, b);
  const road = Math.max(5, d * 1.25);
  const rail = d * 1.2;
  const ends = a.railKm + b.railKm;
  const out: LegOption[] = [];
  if (d >= 60) {
    const [perKm, flat] = TRAIN_FARE[choice.train];
    const fare = (rail * perKm + flat) * people;
    const t = rail / 55 + 1 + ends / 30;
    out.push({ mode: "train", km: Math.round(rail), hours: hrs(t, t * 1.3 + 1), cost: rng(fare + lastMile(ends, people), fare * 1.12 + lastMile(ends, people) * 1.4) });
  }
  if (road <= 1300) {
    const fare = road * BUS_FARE[choice.bus] * people;
    const t = road / 45;
    out.push({ mode: "bus", km: Math.round(road), hours: hrs(t, t * 1.25 + 0.5), cost: rng(fare, fare * 1.25) });
  }
  if (road <= 900) {
    const days = Math.max(1, Math.ceil(road / 450));
    const perCar = road * 13 + 300 * days;
    const t = road / 50;
    out.push({ mode: "cab", km: Math.round(road), hours: hrs(t, t * 1.2 + 0.5), cost: rng(perCar * carsFor(people), (road * 17 + 400 * days) * carsFor(people)) });
  }
  if (d >= 400 && a.airKm !== null && b.airKm !== null && a.airKm <= 200 && b.airKm <= 200) {
    const fare = (2800 + d * 3) * people;
    const ground = a.airKm + b.airKm;
    const t = 2.5 + d / 650 + ground / 40;
    out.push({ mode: "flight", km: Math.round(d), hours: hrs(t, t + 2), cost: rng(fare * 0.75 + lastMile(ground, people), fare * 1.45 + lastMile(ground, people) * 1.4, 100) });
  }
  return out;
}

/** Default mode for a leg from the traveller's style. */
export function pickMode(opts: LegOption[], style: Style): Mode {
  if (!opts.length) return "cab";
  const by = (f: (o: LegOption) => number) => [...opts].sort((x, y) => f(x) - f(y))[0]!.mode;
  if (style === "cheap") return by((o) => o.cost.min);
  if (style === "fast") return by((o) => o.hours.max);
  // Balanced: short hops by cab, middle distances by train, long ones by flight when it saves half a day.
  const km = opts[0]!.km;
  if (km < 120 && opts.some((o) => o.mode === "cab")) return "cab";
  const train = opts.find((o) => o.mode === "train");
  const flight = opts.find((o) => o.mode === "flight");
  if (flight && train && train.hours.max - flight.hours.max > 12) return "flight";
  return train ? "train" : by((o) => o.hours.max);
}

/** Total straight-line km for home -> places in order -> home. */
export function routeKm(home: Point, stops: Point[]): number {
  let km = 0;
  let cur = home;
  for (const s of stops) {
    km += haversine(cur, s);
    cur = s;
  }
  return km + haversine(cur, home);
}

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}
/** Order that keeps total distance lowest (exact up to 7 stops, nearest-neighbour + 2-opt beyond). */
export function bestOrder(home: Point, stops: Point[]): Point[] {
  if (stops.length <= 2) {
    if (stops.length < 2) return stops;
    const rev = [stops[1]!, stops[0]!];
    return routeKm(home, rev) < routeKm(home, stops) - 0.5 ? rev : stops;
  }
  if (stops.length <= 7) {
    let best = stops;
    let bestKm = routeKm(home, stops);
    for (const p of permutations(stops)) {
      const km = routeKm(home, p);
      if (km < bestKm - 0.5) [best, bestKm] = [p, km];
    }
    return best;
  }
  const left = [...stops];
  const out: Point[] = [];
  let cur = home;
  while (left.length) {
    left.sort((x, y) => haversine(cur, x) - haversine(cur, y));
    cur = left.shift()!;
    out.push(cur);
  }
  for (let improved = true; improved; ) {
    improved = false;
    for (let i = 0; i < out.length - 1; i++)
      for (let j = i + 1; j < out.length; j++) {
        const next = [...out.slice(0, i), ...out.slice(i, j + 1).reverse(), ...out.slice(j + 1)];
        if (routeKm(home, next) < routeKm(home, out) - 0.5) {
          out.splice(0, out.length, ...next);
          improved = true;
        }
      }
  }
  return out;
}

/** Nearby places that suit a day trip (within 100 km). */
export const dayTrips = (p: PlaceView) => p.nearby.filter((n) => n.km <= 100);
/** Hours for a nearby visit: there and back by road plus about 1.5 h on site. */
export const tripHours = (km: number) => Math.round((1.5 + (2 * km * 1.25) / 40) * 2) / 2;

/** Suggested days at a place for what the traveller wants to cover. */
export function suggestDays(p: PlaceView, cover: Cover): Range {
  const [lo, hi] = p.darshanHours;
  const darshan = { min: lo > 9 ? 2 : 1, max: hi > 9 ? 2 : 1 };
  if (cover === "darshan") return darshan;
  const extra = dayTrips(p).reduce((h, n) => h + tripHours(n.km), 0);
  return { min: Math.min(3, darshan.min + (extra > 3 ? 1 : 0)), max: Math.min(3, darshan.max + Math.ceil(extra / 8)) };
}

/* ---------------------------- schedule ---------------------------- */

export type SlotKind = "depart" | "travel" | "arrive" | "darshan" | "sights" | "daytrip" | "rest" | "local" | "home";
export interface Slot {
  part: "morning" | "afternoon" | "evening" | "night";
  kind: SlotKind;
  /** Values the UI fills into a translated sentence. */
  v: Record<string, string | number>;
}
export interface Day {
  n: number;
  /** Place id where the night is spent, "move" when overnight on a train or bus, "home" at the end. */
  night: string;
  placeId: string | null;
  slots: Slot[];
}
export interface Stop {
  placeId: string;
  days: 1 | 2 | 3;
}

/** How a leg sits in the calendar: same-evening hop, a day of travel, overnight, or longer. */
export function legShape(hours: number, mode: Mode): "hop" | "day" | "overnight" | "long" {
  if (hours <= 3) return "hop";
  if (mode === "flight" || mode === "cab" || hours <= 7) return "day";
  if (hours <= 15) return "overnight";
  return "long";
}

/**
 * Builds the days. Rules: a hop is taken in the evening of the last day at a
 * place; a day leg uses the morning and the place starts the next day; an
 * overnight leg leaves in the evening and arrives the next morning; a long leg
 * adds a full day on the way.
 */
export function schedule(stops: Stop[], legs: Leg[], places: PlaceView[], cover: Cover): Day[] {
  const days: Day[] = [];
  const day = (placeId: string | null): Day => {
    const d: Day = { n: days.length + 1, night: "", placeId, slots: [] };
    days.push(d);
    return d;
  };
  let cur = day(null);
  const travel = (leg: Leg, toPlace: boolean) => {
    const o = leg.chosen;
    const shape = legShape(o.hours.max, o.mode);
    const v = { mode: o.mode, cls: o.mode === "train" ? leg.choice.train : o.mode === "bus" ? leg.choice.bus : "", from: leg.from, to: leg.to, km: o.km, hmin: o.hours.min, hmax: o.hours.max };
    if (shape === "hop") {
      cur.slots.push({ part: "evening", kind: "depart", v });
      cur.night = toPlace ? leg.to : "home";
      return;
    }
    if (shape === "day") {
      if (cur.slots.length) cur = day(null);
      cur.slots.push({ part: "morning", kind: "depart", v });
      cur.slots.push({ part: "afternoon", kind: toPlace ? "arrive" : "home", v });
      if (toPlace) cur.slots.push({ part: "evening", kind: "rest", v: { to: leg.to } });
      cur.night = toPlace ? leg.to : "home";
      return;
    }
    cur.slots.push({ part: "evening", kind: "depart", v });
    cur.night = "move";
    if (shape === "long") {
      cur = day(null);
      cur.slots.push({ part: "morning", kind: "travel", v });
      cur.night = "move";
    }
    cur = day(null);
    cur.slots.push({ part: "morning", kind: toPlace ? "arrive" : "home", v });
    if (!toPlace) cur.night = "home";
  };

  stops.forEach((st, i) => {
    const p = places.find((x) => x.id === st.placeId);
    if (!p) return;
    travel(legs[i]!, true);
    const morningArrival = cur.slots.length === 1 && cur.slots[0]!.kind === "arrive";
    const trips = cover === "sights" ? dayTrips(p) : [];
    let tripIdx = 0;
    for (let k = 1; k <= st.days; k++) {
      if (!(k === 1 && morningArrival)) cur = day(p.id);
      cur.placeId = p.id;
      if (k === 1) {
        cur.slots.push({ part: morningArrival ? "afternoon" : "morning", kind: "darshan", v: { place: p.id, sight: p.sights[0]?.id ?? "", hmin: p.darshanHours[0], hmax: p.darshanHours[1] } });
        if (!morningArrival && p.sights.length > 1) cur.slots.push({ part: "afternoon", kind: "sights", v: { place: p.id, from: 1, to: Math.min(3, p.sights.length) } });
        cur.slots.push({ part: "evening", kind: "local", v: { place: p.id } });
      } else if (tripIdx < trips.length) {
        let h = 0;
        const today: number[] = [];
        while (tripIdx < trips.length && (today.length === 0 || h + tripHours(trips[tripIdx]!.km) <= 9)) {
          h += tripHours(trips[tripIdx]!.km);
          today.push(tripIdx++);
        }
        cur.slots.push({ part: "morning", kind: "daytrip", v: { place: p.id, idx: today.join(","), h } });
      } else {
        cur.slots.push({ part: "morning", kind: "sights", v: { place: p.id, from: Math.min(1, p.sights.length - 1), to: p.sights.length } });
        cur.slots.push({ part: "evening", kind: "local", v: { place: p.id } });
      }
      cur.night = p.id;
    }
  });
  if (stops.length) travel(legs[stops.length]!, false);
  if (cur.night === "") cur.night = "home";
  return days;
}

export const placePoint = (p: PlaceView): Point => ({ id: p.id, lat: p.geo.lat, lon: p.geo.lon, airKm: p.reach.air.km, railKm: p.reach.rail.km });
export const cityPoint = (c: { id: string; lat: number; lon: number; airport: boolean }): Point => ({ id: c.id, lat: c.lat, lon: c.lon, airKm: c.airport ? 0 : null, railKm: 0 });

/**
 * Legs home -> stop 1 -> ... -> home. `picked` holds the traveller's own choice per leg key
 * ("from>to"); otherwise the style decides. A picked mode that is not possible falls back.
 */
export function buildLegs(home: Point, stops: Point[], people: number, style: Style, picked: Record<string, Partial<Choice>>): Leg[] {
  const pts = [home, ...stops, home];
  const legs: Leg[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const key = `${a.id}>${b.id}`;
    const own = picked[key] ?? {};
    const cls = { train: own.train ?? (style === "cheap" ? "SL" : style === "fast" ? "2A" : "3A"), bus: own.bus ?? (style === "cheap" ? "ordinary" : "sleeper") } as const;
    const options = legOptions(a, b, people, cls);
    const mode = own.mode && options.some((o) => o.mode === own.mode) ? own.mode : pickMode(options, style);
    const chosen = options.find((o) => o.mode === mode) ?? options[0] ?? { mode: "cab" as Mode, km: 0, hours: { min: 0.5, max: 0.5 }, cost: { min: 0, max: 0 } };
    legs.push({ key, from: a.id, to: b.id, km: Math.round(haversine(a, b)), options, choice: { mode: chosen.mode, ...cls }, chosen });
  }
  return legs;
}

/* ------------------------------ costs ------------------------------ */

/** Room per night by budget level, before the place's own cost factor. Two people share a room. */
const ROOM: Record<BudgetBand, [number, number]> = { budget: [800, 1500], mid: [2000, 3500], comfort: [4500, 8000] };
/** Food per person per day. */
const FOOD: Record<BudgetBand, [number, number]> = { budget: [300, 500], mid: [600, 900], comfort: [1200, 2000] };
export const roomsFor = (people: number) => Math.max(1, Math.ceil(people / 2));
/** Places priced above or below the middle (from their own budget bands). */
const factor = (p: PlaceView) => Math.min(1.6, Math.max(0.7, p.budget.bands.mid.max / 3500));

export interface CostLine {
  group: "travel" | "stay" | "food" | "local" | "darshan" | "buffer";
  key: string;
  v: Record<string, string | number>;
  cost: Range;
}

export function costLines(days: Day[], legs: Leg[], places: PlaceView[], people: number, band: BudgetBand, cover: Cover): CostLine[] {
  const out: CostLine[] = legs.map((l, i) => ({
    group: "travel",
    key: `leg${i}`,
    v: { from: l.from, to: l.to, mode: l.chosen.mode, cls: l.chosen.mode === "train" ? l.choice.train : l.chosen.mode === "bus" ? l.choice.bus : "" },
    cost: l.chosen.cost,
  }));
  const nights = new Map<string, number>();
  for (const d of days) if (d.night && d.night !== "move" && d.night !== "home") nights.set(d.night, (nights.get(d.night) ?? 0) + 1);
  for (const [pid, n] of nights) {
    const p = places.find((x) => x.id === pid);
    if (!p) continue;
    const [lo, hi] = ROOM[band];
    const f = factor(p);
    out.push({ group: "stay", key: `stay-${pid}`, v: { place: pid, nights: n, rooms: roomsFor(people) }, cost: rng(lo * f * n * roomsFor(people), hi * f * n * roomsFor(people), 100) });
  }
  const away = days.filter((d) => !(d.n === days.length && d.night === "home" && d.slots.every((s) => s.kind === "home"))).length;
  const [flo, fhi] = FOOD[band];
  out.push({ group: "food", key: "food", v: { days: away, people }, cost: rng(flo * away * people, fhi * away * people, 100) });
  const cars = carsFor(people);
  for (const pid of new Set(days.map((d) => d.placeId).filter((x): x is string => !!x))) {
    const placeDays = days.filter((d) => d.placeId === pid);
    const trips = placeDays.filter((d) => d.slots.some((s) => s.kind === "daytrip")).length;
    const plain = placeDays.length - trips;
    out.push({ group: "local", key: `local-${pid}`, v: { place: pid, days: plain, trips }, cost: rng((plain * 400 + trips * 2800) * cars, (plain * 900 + trips * 3800) * cars) });
  }
  const stopsN = new Set(days.map((d) => d.placeId).filter(Boolean)).size;
  out.push({ group: "darshan", key: "darshan", v: { places: stopsN, people }, cost: rng(0, (cover === "sights" ? 400 : 250) * stopsN * people) });
  const sub = out.reduce((s, l) => ({ min: s.min + l.cost.min, max: s.max + l.cost.max }), { min: 0, max: 0 });
  out.push({ group: "buffer", key: "buffer", v: {}, cost: rng(sub.min * 0.05, sub.max * 0.1, 100) });
  return out;
}

export const totalOf = (lines: CostLine[]): Range => lines.reduce((s, l) => ({ min: s.min + l.cost.min, max: s.max + l.cost.max }), { min: 0, max: 0 });

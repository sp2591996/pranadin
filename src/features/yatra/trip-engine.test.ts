import { describe, expect, it } from "vitest";
import { loadCities, loadPlaces } from "./content.server";
import { bestOrder, buildLegs, cityPoint, costLines, haversine, legOptions, legShape, placePoint, routeKm, schedule, suggestDays, totalOf } from "./trip-engine";

const places = loadPlaces("en");
const cities = loadCities("en");
const P = (id: string) => placePoint(places.find((p) => p.id === id)!);
const C = (id: string) => cityPoint(cities.find((c) => c.id === id)!);

describe("trip engine (D-038)", () => {
  it("distances are realistic", () => {
    expect(Math.round(haversine(C("pune"), C("delhi")))).toBeGreaterThan(1150);
    expect(Math.round(haversine(C("pune"), C("delhi")))).toBeLessThan(1250);
  });

  it("Pune to Delhi by 3AC is near the published fare (about 2,000 per person)", () => {
    const t = legOptions(C("pune"), C("delhi"), 1, { train: "3A", bus: "sleeper" }).find((o) => o.mode === "train")!;
    expect(t.cost.min).toBeGreaterThan(1600);
    expect(t.cost.max).toBeLessThan(2700);
    const sl = legOptions(C("pune"), C("delhi"), 1, { train: "SL", bus: "sleeper" }).find((o) => o.mode === "train")!;
    expect(sl.cost.min).toBeLessThan(t.cost.min);
  });

  it("offers flights only for long legs with airports, and cabs only for shorter ones", () => {
    const shirdi = legOptions(C("pune"), P("shirdi"), 2, { train: "3A", bus: "sleeper" }).map((o) => o.mode);
    expect(shirdi).not.toContain("flight");
    expect(shirdi).toContain("cab");
    const far = legOptions(C("pune"), P("varanasi"), 2, { train: "3A", bus: "sleeper" }).map((o) => o.mode);
    expect(far).toContain("flight");
    expect(far).not.toContain("cab");
  });

  it("best order never makes the route longer", () => {
    const stops = ["haridwar", "shirdi", "rishikesh", "ujjain"].map(P);
    const best = bestOrder(C("pune"), stops);
    expect(best).toHaveLength(4);
    expect(routeKm(C("pune"), best)).toBeLessThanOrEqual(routeKm(C("pune"), stops));
    // Haridwar and Rishikesh sit next to each other in the best order.
    const ids = best.map((s) => s.id);
    expect(Math.abs(ids.indexOf("haridwar") - ids.indexOf("rishikesh"))).toBe(1);
  });

  it("long legs become overnight or a day on the way, short hops stay in the evening", () => {
    expect(legShape(1, "cab")).toBe("hop");
    expect(legShape(5, "bus")).toBe("day");
    expect(legShape(12, "train")).toBe("overnight");
    expect(legShape(26, "train")).toBe("long");
    expect(legShape(6, "flight")).toBe("day");
  });

  it("suggests more days when sightseeing is wanted", () => {
    const v = places.find((p) => p.id === "varanasi")!;
    expect(suggestDays(v, "sights").max).toBeGreaterThanOrEqual(suggestDays(v, "darshan").max);
    expect(suggestDays(places.find((p) => p.id === "kedarnath")!, "darshan").min).toBe(2);
  });

  it("builds a full plan and a split cost for a group", () => {
    const stops = [{ placeId: "shirdi", days: 1 as const }, { placeId: "haridwar", days: 2 as const }];
    const legs = buildLegs(C("pune"), stops.map((s) => P(s.placeId)), 4, "balanced", {});
    expect(legs).toHaveLength(3);
    const days = schedule(stops, legs, places, "sights");
    expect(days.length).toBeGreaterThanOrEqual(4);
    expect(days.at(-1)!.night).toBe("home");
    const lines = costLines(days, legs, places, 4, "mid", "sights");
    for (const g of ["travel", "stay", "food", "local", "darshan", "buffer"]) expect(lines.some((l) => l.group === g)).toBe(true);
    const total = totalOf(lines);
    expect(total.min).toBeGreaterThan(0);
    expect(total.max).toBeGreaterThanOrEqual(total.min);
    // Picking 1AC on the long leg costs more than sleeper.
    const k = legs[1]!.key;
    const hi = totalOf(costLines(days, buildLegs(C("pune"), stops.map((s) => P(s.placeId)), 4, "balanced", { [k]: { mode: "train", train: "1A" } }), places, 4, "mid", "sights"));
    const lo = totalOf(costLines(days, buildLegs(C("pune"), stops.map((s) => P(s.placeId)), 4, "balanced", { [k]: { mode: "train", train: "SL" } }), places, 4, "mid", "sights"));
    expect(hi.min).toBeGreaterThan(lo.min);
  });
});

import { describe, expect, it } from "vitest";
import { inWindow, isOn, observancesOn, upcoming } from "./observances";

const items = [
  { id: "a", date: "2026-11-20", endDate: null },
  { id: "hanukkah", date: "2026-12-04", endDate: "2026-12-12" },
  { id: "b", date: "2026-11-24", endDate: null },
  { id: "c", date: "2026-11-24", endDate: null },
  { id: "nye", date: "2026-12-31", endDate: null },
  { id: "ny", date: "2027-01-01", endDate: null },
];

describe("observance queries", () => {
  it("matches single and multi-day items", () => {
    expect(isOn(items[1]!, "2026-12-08")).toBe(true);
    expect(isOn(items[1]!, "2026-12-13")).toBe(false);
    expect(observancesOn(items, "2026-11-24").map((i) => i.id)).toEqual(["b", "c"]);
    expect(observancesOn(items, "2026-11-21")).toEqual([]);
  });

  it("lists the next 7 days grouped by date, excluding today", () => {
    const u = upcoming(items, "2026-11-20", 7);
    expect(u.map((g) => g.date)).toEqual(["2026-11-24"]);
    expect(u[0]!.items.map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("crosses the year edge", () => {
    expect(upcoming(items, "2026-12-29", 7).map((g) => g.date)).toEqual(["2026-12-31", "2027-01-01"]);
  });

  it("does not repeat a multi-day item already running", () => {
    expect(upcoming(items, "2026-12-05", 7).flatMap((g) => g.items.map((i) => i.id))).toEqual([]);
  });

  it("knows the verified window", () => {
    const w = { from: "2026-11-20", to: "2027-03-31" };
    expect(inWindow(w, "2027-03-31")).toBe(true);
    expect(inWindow(w, "2027-04-01")).toBe(false);
  });
});

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { placeCoreSchema, placeGuideSchema, placeSightsSchema, yatraUiSchema } from "@/content/yatra";
import { loadFestivalsFile } from "@/features/festivals/content.server";
import { loadPlaces, loadYatraFile, loadYatraStrings } from "./content.server";
import { STARTERS, addDaysKey, seasonWarnings } from "./plan-extras";
import { addPlace, buildPlan, estimateBudget, movePlace, planToText, removePlace, sanitizeItems, setDays, totalDays, type TripItem } from "./plan-logic";

const ROOT = path.join(process.cwd(), "content", "yatra");
const raw = (...p: string[]) => JSON.parse(fs.readFileSync(path.join(ROOT, ...p), "utf8").replace(/^﻿/, "")) as unknown;
const dirs = fs.readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const banned = (JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/lint/banned-claims.json"), "utf8")) as {
  rules: { id: string; pattern: string; allowIfContext?: string }[];
}).rules;
const strings = (x: unknown, out: string[] = []): string[] => {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => strings(v, out));
  else if (x && typeof x === "object") Object.values(x).forEach((v) => strings(v, out));
  return out;
};

describe("yatra content", () => {
  it("includes the two reference places and a valid _ui.json", () => {
    expect(dirs).toEqual(expect.arrayContaining(["pandharpur", "varanasi"]));
    expect(yatraUiSchema.safeParse(raw("_ui.json")).error?.issues ?? []).toEqual([]);
  });

  for (const d of ["varanasi", "pandharpur"]) {
    it(`${d}: every part validates`, () => {
      expect(placeCoreSchema.safeParse(raw(d, "core.json")).error?.issues ?? []).toEqual([]);
      expect(placeSightsSchema.safeParse(raw(d, "sights.json")).error?.issues ?? []).toEqual([]);
      expect(placeGuideSchema.safeParse(raw(d, "guide.json")).error?.issues ?? []).toEqual([]);
    });
  }

  it("merges into full places with 2+ https sources, linked festivals and existing photo files within 80 KB", () => {
    const fests = new Set(loadFestivalsFile().festivals.map((f) => f.id));
    for (const p of loadYatraFile().places) {
      expect(p.sources.length, p.id).toBeGreaterThanOrEqual(2);
      for (const s of p.sources) expect(s.url).toMatch(/^https:\/\//);
      for (const f of p.festivals) expect(fests.has(f.festivalId), `${p.id}: ${f.festivalId}`).toBe(true);
      for (const ph of p.photos) {
        const file = path.join(process.cwd(), "public", "yatra", p.id, ph.file);
        expect(fs.existsSync(file), file).toBe(true);
        // Real 1200×800 photos (D-037) may be up to 160 KB; AI images stay small.
        expect(fs.statSync(file).size, file).toBeLessThanOrEqual((ph.ai ? 80 : 160) * 1024);
        if (!ph.ai) expect(ph.credit.length).toBeGreaterThan(2);
      }
    }
  });

  it("has en, hi and mr text everywhere, so content:gaps stays at 0 and no English shows in hi or mr", () => {
    for (const l of ["hi", "mr"] as const) {
      for (const p of loadPlaces(l)) {
        for (const t of [p.name, p.overview, p.story, p.significance, p.localTransport, p.satvik, p.budget.note]) expect(t.lang, `${l}/${p.id}`).toBe(l);
        for (const t of [...p.health, ...p.etiquette, ...p.darshan.tips]) expect(t.lang, `${l}/${p.id}`).toBe(l);
        for (const s of p.sights) for (const t of [s.name, s.desc, s.timings, s.dress]) expect(t.lang, `${l}/${p.id}/${s.id}`).toBe(l);
        for (const i of p.itineraries) for (const day of i.plan) for (const x of day) expect(x.text.lang, `${l}/${p.id}`).toBe(l);
      }
      const ui = loadYatraStrings(l);
      expect(ui["@localized"]!.split("|").length, l).toBe(Object.keys(ui).length - 1);
    }
  });

  it("passes the banned-claims lint", () => {
    for (const d of dirs) {
      for (const f of ["core.json", "sights.json", "guide.json"]) {
        for (const s of strings(raw(d, f))) {
          for (const r of banned) {
            const m = new RegExp(r.pattern, "i").exec(s);
            if (!m) continue;
            const ctx = s.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60);
            expect(r.allowIfContext ? new RegExp(r.allowIfContext, "i").test(ctx) : false, `${d}/${f} ${r.id}: ${s}`).toBe(true);
          }
        }
      }
    }
  });
});

describe("trip planner logic", () => {
  const places = loadPlaces("en");
  const ids = places.map((p) => p.id);

  it("adds, removes, reorders and sets days without duplicates", () => {
    let t: TripItem[] = [];
    t = addPlace(t, "varanasi");
    t = addPlace(t, "varanasi", 3);
    t = addPlace(t, "pandharpur", 2);
    expect(t).toEqual([{ placeId: "varanasi", days: 1 }, { placeId: "pandharpur", days: 2 }]);
    expect(totalDays(t)).toBe(3);
    t = movePlace(t, "pandharpur", -1);
    expect(t.map((i) => i.placeId)).toEqual(["pandharpur", "varanasi"]);
    expect(movePlace(t, "pandharpur", -1)).toBe(t);
    t = setDays(t, "varanasi", 3);
    expect(totalDays(t)).toBe(5);
    expect(removePlace(t, "pandharpur").map((i) => i.placeId)).toEqual(["varanasi"]);
  });

  it("sanitises stored garbage", () => {
    expect(sanitizeItems("x", ids)).toEqual([]);
    expect(sanitizeItems([{ placeId: "nowhere", days: 1 }, { placeId: "varanasi", days: 9 }, { placeId: "varanasi", days: 2 }, null], ids)).toEqual([{ placeId: "varanasi", days: 1 }]);
  });

  it("builds a combined day-by-day plan numbered across places", () => {
    const plan = buildPlan([{ placeId: "varanasi", days: 2 }, { placeId: "pandharpur", days: 1 }], places);
    expect(plan.map((d) => d.dayNo)).toEqual([1, 2, 3]);
    expect(plan.map((d) => `${d.placeId}:${d.placeDay}/${d.ofDays}`)).toEqual(["varanasi:1/2", "varanasi:2/2", "pandharpur:1/1"]);
    expect(plan.every((d) => d.parts.length >= 2)).toBe(true);
    expect(buildPlan([], places)).toEqual([]);
  });

  it("estimates an indicative budget as days x band and renders plain text", () => {
    const items: TripItem[] = [{ placeId: "varanasi", days: 2 }, { placeId: "pandharpur", days: 1 }];
    expect(estimateBudget(items, places, "budget")).toEqual({ min: 2 * 1000 + 600, max: 2 * 2000 + 1500 });
    const text = planToText(buildPlan(items, places), {
      title: "Plan",
      day: (n, p, k, of) => `Day ${n}: ${p} (${k}/${of})`,
      part: { morning: "AM", afternoon: "PM", evening: "Eve" },
      footer: "Check locally",
    });
    expect(text.split("\n")[0]).toBe("Plan");
    expect(text).toContain("Day 3: Pandharpur (1/1)");
    expect(text.trimEnd().endsWith("Check locally")).toBe(true);
  });
});

describe("trip planner dates, starters and seasons (D-037)", () => {
  const places = loadPlaces("en");
  it("adds days across month and year ends", () => {
    expect(addDaysKey("2027-01-31", 1)).toBe("2027-02-01");
    expect(addDaysKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysKey("bad", 1)).toBeNull();
  });
  it("every ready trip uses real places and 1-3 days each", () => {
    for (const st of STARTERS) for (const i of st.items) expect(places.some((p) => p.id === i.placeId), `${st.id}/${i.placeId}`).toBe(true);
  });
  it("warns once per place for a difficult month", () => {
    const plan = buildPlan([{ placeId: "kedarnath", days: 2 }], places);
    const w = seasonWarnings(plan, places, "2027-01-10");
    expect(w).toHaveLength(1);
    expect(w[0]!.month).toBe(1);
    expect(seasonWarnings(plan, places, "2027-06-10")).toHaveLength(0);
  });
});

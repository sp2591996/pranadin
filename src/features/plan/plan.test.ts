import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { JournalEntry, PracticeLog } from "@/lib/types";
import { loadPlanContent } from "@/features/shared/content.server";
import { buildPlan, dayIndex, doneToday, needsWelcomeBack, slugOf } from "./plan";

const content = loadPlanContent("en");

describe("plan content (Content files)", () => {
  it("loads 12 cards and a 7-day rotation for every goal", () => {
    expect(Object.keys(content.cards)).toHaveLength(12);
    for (const g of ["calm", "sleep", "focus", "devotion", "explore"]) expect(content.rotation[g]).toHaveLength(7);
  });

  it("every breath and stillness card points at a page that is built", () => {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/data/practices.json"), "utf8")) as {
      techniques: { id: string }[];
      meditations: { id: string }[];
    };
    const ids = new Set([...data.techniques, ...data.meditations].map((x) => x.id));
    for (const c of Object.values(content.cards)) if (c.type !== "reflection") expect(ids.has(c.practiceId!), c.id).toBe(true);
  });
});

describe("buildPlan (US-04, US-07, US-08, US-09)", () => {
  it("Sleep + 10 min = Breath 3 + Stillness 6 + Reflection 1 using Sleep cards", () => {
    const plan = buildPlan(content, "sleep", 10, "2026-11-20");
    expect(plan.map((s) => [s.n, s.type, s.minutes])).toEqual([
      [1, "breath", 3],
      [2, "stillness", 6],
      [3, "reflection", 1],
    ]);
    expect(plan[1]!.card.id).toBe("card.stillness.body-scan");
    expect(["card.breath.bhramari", "card.breath.deergha"]).toContain(plan[0]!.card.id);
  });

  it("skip-everything defaults (Calm, 10) give a valid 3-step plan", () => {
    expect(buildPlan(content, "calm", 10, "2026-11-20")).toHaveLength(3);
  });

  it("is the same all day and different the next day (breath card changes daily)", () => {
    const a = buildPlan(content, "calm", 10, "2026-11-20");
    expect(buildPlan(content, "calm", 10, "2026-11-20")).toEqual(a);
    const b = buildPlan(content, "calm", 10, "2026-11-21");
    expect(b[0]!.card.id).not.toBe(a[0]!.card.id);
  });

  it("budgets 5 and 20 minutes", () => {
    expect(buildPlan(content, "focus", 5, "2026-11-20").map((s) => s.minutes)).toEqual([2, 2, 1]);
    expect(buildPlan(content, "focus", 20, "2026-11-20").map((s) => s.minutes)).toEqual([5, 13, 2]);
  });

  it("dayIndex follows the Content rule", () => {
    expect(dayIndex("2026-01-01")).toBe(0);
    expect(dayIndex("2026-01-08")).toBe(0);
    expect(dayIndex("2025-12-31")).toBe(6);
  });

  it("slugs match the practice routes", () => {
    expect(slugOf("breath.nadi-shodhana")).toBe("nadi-shodhana");
    expect(slugOf("med.body-scan")).toBe("body-scan");
  });
});

describe("welcome back (US-17)", () => {
  it("only after 2+ empty days for someone who has practised", () => {
    expect(needsWelcomeBack(new Set(), "2026-11-20")).toBe(false);
    expect(needsWelcomeBack(new Set(["2026-11-19"]), "2026-11-20")).toBe(false);
    expect(needsWelcomeBack(new Set(["2026-11-18"]), "2026-11-20")).toBe(false);
    expect(needsWelcomeBack(new Set(["2026-11-17"]), "2026-11-20")).toBe(true);
    // practising today doesn't change today's plan
    expect(needsWelcomeBack(new Set(["2026-11-17", "2026-11-20"]), "2026-11-20")).toBe(true);
  });

  it("gives a shortened first step: 3 minutes in total", () => {
    const plan = buildPlan(content, "sleep", 20, "2026-11-20", true);
    expect(plan.map((s) => [s.type, s.minutes])).toEqual([
      ["breath", 2],
      ["reflection", 1],
    ]);
  });
});

describe("doneToday", () => {
  const log = (kind: PracticeLog["kind"], completed: boolean, localDate = "2026-11-20") =>
    ({ v: 1, id: kind, at: 0, localDate, kind, refId: null, plannedSec: 180, actualSec: 180, completed, source: "plan" }) as PracticeLog;
  it("marks completed practices and journal lines from today only", () => {
    const done = doneToday(
      [log("breath", true), log("stillness", false), log("stillness", true, "2026-11-19")],
      [{ localDate: "2026-11-20" } as JournalEntry],
      "2026-11-20",
    );
    expect([...done].sort()).toEqual(["breath", "reflection"]);
  });
});

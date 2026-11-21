import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { COMPLETION_THRESHOLD } from "@/lib/types";
import { allModuleSlugs, allPoseSlugs, loadModuleList, loadPoseList, loadProgramList, loadSession, loadYogaFile, loadYogaStrings } from "./content.server";
import {
  countsAsDone,
  emptyProgress,
  initialState,
  jump,
  markDay,
  moduleSeconds,
  nextDay,
  practisedTotalMs,
  summarize,
  tick,
  unmarkDay,
} from "./logic";
import { programId, programSlug, yogaRoutes } from "./routes";

// Same red line as tests/e2e/helpers.ts (BREATH_HOLD).
const BREATH_HOLD = /\bhold (?:your|the) breath for\b|\bHold\s*[·:]?\s*\d|kumbhak|कुंभक/i;
const CONTENT = path.join(process.cwd(), "content");
const banned = (JSON.parse(fs.readFileSync(path.join(CONTENT, "lint/banned-claims.json"), "utf8")) as {
  rules: { id: string; pattern: string; allowIfContext?: string }[];
}).rules;

const strings = (x: unknown, out: string[] = []): string[] => {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => strings(v, out));
  else if (x && typeof x === "object") Object.values(x).forEach((v) => strings(v, out));
  return out;
};

const source = z.object({ name: z.string().min(3), url: z.url().optional() });
const poseSchema = z.object({
  id: z.string().regex(/^pose\.[a-z0-9-]+$/),
  slug: z.string(),
  name: z.string().min(2),
  sanskrit: z.string().min(2),
  transliteration: z.string().min(2),
  category: z.enum(["Standing", "Balance", "Seated", "Kneeling", "Prone", "Supine", "Twist", "Inversion"]),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  holdSeconds: z.number().int().min(10).max(600),
  image: z.object({ file: z.string().regex(/\.webp$/), alt: z.string().min(5) }),
  summary: z.string().min(20),
  breathTip: z.string().min(10),
  steps: z.array(z.string().min(5)).min(3),
  benefits: z.array(z.string().min(5)).min(2),
  cautions: z.array(z.string().min(5)).min(1),
  sources: z.array(source).min(1),
});

describe("yoga content (en)", () => {
  const file = loadYogaFile();

  it("has about 29 valid poses, each with a source, cautions and steps", () => {
    expect(file.poses.length).toBe(29);
    for (const p of file.poses) {
      const r = poseSchema.safeParse(p);
      expect(r.success, `${p.slug}: ${JSON.stringify(r.error?.issues)}`).toBe(true);
      expect(p.sources.length, p.slug).toBeGreaterThan(0);
      expect(p.cautions.length, p.slug).toBeGreaterThan(0);
    }
    expect(new Set(allPoseSlugs()).size).toBe(29);
  });

  it("every pose image exists, is WebP and is at most 60 KB", () => {
    for (const p of file.poses) {
      const f = path.join(process.cwd(), "public/yoga", p.image.file);
      expect(fs.existsSync(f), p.image.file).toBe(true);
      expect(fs.statSync(f).size, p.image.file).toBeLessThanOrEqual(60 * 1024);
      expect(fs.readFileSync(f).subarray(8, 12).toString(), p.image.file).toBe("WEBP");
    }
    expect(fs.existsSync(path.join(process.cwd(), "public/yoga/placeholder.png"))).toBe(false);
  });

  it("never instructs breath retention (red line)", () => {
    for (const s of strings(file)) expect(s, s).not.toMatch(BREATH_HOLD);
    for (const l of ["hi", "mr"]) for (const s of strings(JSON.parse(fs.readFileSync(path.join(CONTENT, l, "yoga.json"), "utf8")))) expect(s).not.toMatch(BREATH_HOLD);
  });

  it("passes the banned-claims lint (no medical or hype wording)", () => {
    for (const s of strings(file)) {
      for (const r of banned) {
        const m = new RegExp(r.pattern, "i").exec(s);
        if (!m) continue;
        const ctx = s.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60);
        const allowed = r.allowIfContext ? new RegExp(r.allowIfContext, "i").test(ctx) : false;
        expect(allowed, `${r.id}: ${s}`).toBe(true);
      }
    }
  });

  it("sessions only link to real poses and have sensible timing", () => {
    const slugs = new Set(allPoseSlugs());
    expect(file.modules.length).toBeGreaterThanOrEqual(8);
    for (const m of file.modules) {
      expect(m.steps.length, m.slug).toBeGreaterThan(2);
      for (const st of m.steps) {
        expect(st.seconds, `${m.slug}/${st.title}`).toBeGreaterThanOrEqual(30);
        if (st.pose) expect(slugs.has(st.pose), `${m.slug}: ${st.pose}`).toBe(true);
      }
      expect(moduleSeconds(m.steps) / 60, m.slug).toBeLessThan(35);
    }
    expect(allModuleSlugs()).toContain("beginner-foundation");
  });

  it("has a Beginner, an Intermediate and an Advanced programme, with every day pointing at a session", () => {
    const mods = new Set(allModuleSlugs());
    expect(file.programs.map((p) => p.level)).toEqual(["Beginner", "Intermediate", "Advanced"]);
    expect(file.programs.map((p) => p.days.length)).toEqual([7, 14, 21]);
    for (const p of file.programs) {
      p.days.forEach((d, i) => {
        expect(d.day).toBe(i + 1);
        expect(mods.has(d.module), `${p.id} day ${d.day}`).toBe(true);
      });
    }
  });

  it("loaders hand the client trimmed, localised views (HI/MR drafts are shown, D-030)", () => {
    expect(loadPoseList("en")).toHaveLength(29);
    for (const l of ["hi", "mr"] as const) {
      const hi = loadPoseList(l);
      expect(hi.every((p) => p.nameLang === l)).toBe(true);
      expect(hi[0]!.name).not.toBe(loadPoseList("en")[0]!.name);
      expect(loadModuleList(l).every((m) => m.titleLang === l)).toBe(true);
      expect(loadProgramList(l).every((p) => p.titleLang === l)).toBe(true);
      expect(loadYogaStrings(l)["yoga.title"]).not.toBe(loadYogaStrings("en")["yoga.title"]);
    }
    const s = loadSession("beginner-foundation", "en")!;
    expect(Object.keys(s.poses).length).toBeGreaterThan(3);
  });

  it("HI and MR drafts exist for every pose, session and programme (draft status is fine, shown per D-030)", () => {
    for (const l of ["hi", "mr"]) {
      const j = JSON.parse(fs.readFileSync(path.join(CONTENT, l, "yoga.json"), "utf8")) as Record<string, Record<string, { reviewed: boolean }>>;
      expect(Object.keys(j.poses!).sort()).toEqual([...allPoseSlugs()].sort());
      expect(Object.keys(j.modules!).sort()).toEqual([...allModuleSlugs()].sort());
      expect(Object.keys(j.programs!)).toHaveLength(3);
      for (const group of [j.poses!, j.modules!, j.programs!]) for (const v of Object.values(group)) expect(v.reviewed).toBe(false);
      const ui = JSON.parse(fs.readFileSync(path.join(CONTENT, l, "ui.json"), "utf8")) as { strings: Record<string, { reviewed: boolean }> };
      const en = JSON.parse(fs.readFileSync(path.join(CONTENT, "en/ui.json"), "utf8")) as { strings: Record<string, string> };
      for (const k of Object.keys(en.strings).filter((x) => x.startsWith("yoga."))) {
        expect(ui.strings[k], `${l} ${k}`).toBeDefined();
        expect(ui.strings[k]!.reviewed, `${l} ${k}`).toBe(false);
      }
    }
  });
});

describe("routes", () => {
  it("builds trailing-slash links and programme ids round-trip", () => {
    expect(yogaRoutes.pose("en", "tadasana")).toBe("/en/practice/yoga/pose/tadasana/");
    expect(yogaRoutes.session("hi", "restful-reset", { id: "prog.beginner-7", day: 3 })).toBe("/hi/practice/yoga/session/restful-reset/?prog=beginner-7&day=3");
    expect(programId(programSlug("prog.beginner-7"))).toBe("prog.beginner-7");
  });
});

describe("player timing", () => {
  const steps = [{ seconds: 10 }, { seconds: 20 }, { seconds: 30 }];

  it("moves through steps by elapsed time and reports when the last one ends", () => {
    let r = tick(steps, initialState, 5_000);
    expect(r).toMatchObject({ changed: false, done: false, state: { index: 0, stepMs: 5_000 } });
    r = tick(steps, r.state, 10_000);
    expect(r).toMatchObject({ changed: true, done: false, state: { index: 1, stepMs: 0, practisedMs: 10_000 } });
    r = tick(steps, r.state, 20_000);
    expect(r.state.index).toBe(2);
    r = tick(steps, r.state, 30_000);
    expect(r.done).toBe(true);
    expect(practisedTotalMs(r.state)).toBe(60_000);
  });

  it("next and previous keep the time already practised", () => {
    const a = jump(steps, { index: 0, stepMs: 4_000, practisedMs: 0 }, 1);
    expect(a.state).toEqual({ index: 1, stepMs: 0, practisedMs: 4_000 });
    const b = jump(steps, a.state, -1);
    expect(b.state.index).toBe(0);
    expect(b.state.practisedMs).toBe(4_000);
    expect(jump(steps, { index: 0, stepMs: 0, practisedMs: 0 }, -1).state.index).toBe(0);
    expect(jump(steps, { index: 2, stepMs: 3_000, practisedMs: 30_000 }, 1)).toMatchObject({ done: true });
  });

  it("a day counts at 80% of the planned time", () => {
    expect(COMPLETION_THRESHOLD).toBe(0.8);
    expect(countsAsDone(48_000, 60)).toBe(true);
    expect(countsAsDone(47_000, 60)).toBe(false);
    expect(countsAsDone(0, 0)).toBe(false);
  });
});

describe("programme progress", () => {
  const today = "2026-11-21";

  it("marks days once, in order, and ignores out-of-range days", () => {
    let p = markDay(undefined, "prog.beginner-7", 2, 7, today, 1);
    p = markDay(p, "prog.beginner-7", 1, 7, today, 2);
    p = markDay(p, "prog.beginner-7", 2, 7, today, 3);
    expect(p.days).toEqual([1, 2]);
    expect(markDay(p, "prog.beginner-7", 8, 7, today).days).toEqual([1, 2]);
    expect(markDay(p, "prog.beginner-7", 0, 7, today).days).toEqual([1, 2]);
    expect(p).toMatchObject({ v: 1, id: "prog.beginner-7", startedOn: today });
  });

  it("finds the next day and summarises", () => {
    expect(nextDay(undefined, 7)).toBe(1);
    const p = { ...emptyProgress("prog.x", today), days: [1, 2, 4] };
    expect(nextDay(p, 7)).toBe(3);
    expect(summarize(p, 7)).toEqual({ done: 3, total: 7, next: 3, finished: false });
    const all = { ...p, days: [1, 2, 3, 4, 5, 6, 7] };
    expect(summarize(all, 7)).toMatchObject({ finished: true, next: null });
  });

  it("can undo a day", () => {
    const p = { ...emptyProgress("prog.x", today), days: [1, 2] };
    expect(unmarkDay(p, 2, today).days).toEqual([1]);
  });
});

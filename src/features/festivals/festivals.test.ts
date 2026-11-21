import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { festivalSchema, festivalsUiSchema } from "@/content/draft";
import { loadFestivalsFile, loadFestivals, festivalByObservance } from "./content.server";

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
const raw = (f: string) => JSON.parse(fs.readFileSync(path.join(CONTENT, "festivals", f), "utf8").replace(/^﻿/, "")) as unknown;
const files = fs.readdirSync(path.join(CONTENT, "festivals")).filter((f) => f.endsWith(".json") && !f.startsWith("_"));

describe("festival content", () => {
  it("has 24 valid files and a valid _ui.json", () => {
    expect(files).toHaveLength(24);
    for (const f of files) expect(festivalSchema.safeParse(raw(f)).error?.issues ?? [], f).toEqual([]);
    expect(festivalsUiSchema.safeParse(raw("_ui.json")).error?.issues ?? []).toEqual([]);
  });

  it("has en, hi and mr text for every field, and 2+ sources with links", () => {
    for (const f of loadFestivalsFile().festivals) {
      const len = (v: string | { text: string }) => (typeof v === "string" ? v : v.text).trim().length;
      for (const k of ["name", "tagline", "story", "storySource", "why", "regional", "foods", "note"] as const)
        for (const l of ["en", "hi", "mr"] as const) expect(len(f[k][l]), `${f.id}.${k}.${l}`).toBeGreaterThan(0);
      for (const st of f.steps) for (const l of ["en", "hi", "mr"] as const) expect(len(st[l]), `${f.id}.steps.${l}`).toBeGreaterThan(0);
      expect(f.sources.length, f.id).toBeGreaterThanOrEqual(2);
      for (const s of f.sources) expect(s.url, f.id).toMatch(/^https:\/\//);
    }
  });

  it("shows no English fallback in hi and mr", () => {
    for (const l of ["hi", "mr"] as const) for (const f of loadFestivals(l)) expect(f.story.lang, `${l}/${f.id}`).toBe(l);
  });

  it("passes the banned-claims lint", () => {
    for (const f of files) {
      for (const s of strings(raw(f))) {
        for (const r of banned) {
          const m = new RegExp(r.pattern, "i").exec(s);
          if (!m) continue;
          const ctx = s.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60);
          const allowed = r.allowIfContext ? new RegExp(r.allowIfContext, "i").test(ctx) : false;
          expect(allowed, `${f} ${r.id}: ${s}`).toBe(true);
        }
      }
    }
  });

  it("links observances to one festival each", () => {
    const all = loadFestivalsFile().festivals.flatMap((f) => f.observances);
    expect(new Set(all).size).toBe(all.length);
    expect(Object.keys(festivalByObservance()).length).toBe(all.length);
  });
});

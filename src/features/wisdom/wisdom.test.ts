import { describe, expect, it } from "vitest";
import { chakrasSchema, pickText, wisdomSchema } from "@/content/draft";
import { loadChakras, loadChakrasFile } from "@/features/chakras/content.server";
import { loadVerses, loadWisdomFile } from "./content.server";
import { pickVerseIndex } from "./pick";

// Claims the app must never make (health red line). "health" alone is allowed in disclaimers.
const CLAIM = /\b(cure[sd]?|curing|heal(?:s|ed|ing|er)?|treat(?:s|ed|ing|ment|ments)?)\b/i;

function allEnglish(o: unknown, out: string[] = []): string[] {
  if (typeof o === "string") out.push(o);
  else if (Array.isArray(o)) o.forEach((x) => allEnglish(x, out));
  else if (o && typeof o === "object") {
    const r = o as Record<string, unknown>;
    if (typeof r.en === "string") out.push(r.en);
    else for (const [k, v] of Object.entries(r)) if (k !== "sources" && k !== "hi" && k !== "mr") allEnglish(v, out);
  }
  return out;
}

describe("chakras.json", () => {
  const file = loadChakrasFile();
  it("loads and validates", () => {
    expect(chakrasSchema.safeParse(file).success).toBe(true);
    expect(file.chakras).toHaveLength(7);
  });
  it("every chakra has a source and every UI key code uses exists", () => {
    for (const c of file.chakras) expect(c.sources.length, c.id).toBeGreaterThan(0);
    for (const k of ["title", "intro", "back", "backToPractice", "location", "element", "colour", "bija", "noBija", "petals", "meaningOf", "practice", "affirmation", "sources", "colourNote", "disclaimer", "motifLabel"])
      expect(file.ui[`chakras.${k}`], k).toBeDefined();
  });
  it("has no cure/heal/treat claims in any English text", () => {
    for (const t of allEnglish([file.chakras, file.ui])) expect(t).not.toMatch(CLAIM);
  });
  it("shows HI/MR draft text although reviewed is false (D-030)", () => {
    const hi = loadChakras("hi")[0]!;
    expect(file.chakras[0]!.nick.hi.reviewed).toBe(false);
    expect(hi.nick.lang).toBe("hi");
    expect(hi.nick.text).toBe(file.chakras[0]!.nick.hi.text);
  });
});

describe("wisdom.json", () => {
  const file = loadWisdomFile();
  it("loads and validates 36 verses", () => {
    expect(wisdomSchema.safeParse(file).success).toBe(true);
    expect(file.verses).toHaveLength(36);
  });
  it("every verse has a reference, work, script and a source", () => {
    for (const v of file.verses) {
      expect(v.reference, v.id).toBeTruthy();
      expect(v.work, v.id).toBeTruthy();
      expect(v.script.text, v.id).toBeTruthy();
      expect(v.sources.length, v.id).toBeGreaterThan(0);
    }
  });
  it("every UI key code uses exists", () => {
    for (const k of ["title", "meaning", "paraphrase", "share", "copied", "shareFailed", "sources", "by"]) expect(file.ui[`wisdom.${k}`], k).toBeDefined();
  });
  it("has no cure/heal/treat claims in any English text", () => {
    for (const t of allEnglish([file.verses, file.ui])) expect(t).not.toMatch(CLAIM);
  });
  it("shows draft HI text and falls back to English when blank", () => {
    expect(loadVerses("mr")[0]!.meaning.lang).toBe("mr");
    expect(pickText({ en: "a", hi: { text: " ", reviewed: false } }, "hi")).toEqual({ text: "a", lang: "en" });
  });
});

describe("pickVerseIndex", () => {
  it("is deterministic for a date", () => {
    expect(pickVerseIndex("2026-11-21", 36)).toBe(pickVerseIndex("2026-11-21", 36));
  });
  it("advances by one per day and wraps", () => {
    const a = pickVerseIndex("2026-11-21", 36);
    expect(pickVerseIndex("2026-11-22", 36)).toBe((a + 1) % 36);
  });
  it("covers every verse in `count` consecutive days", () => {
    const all = new Set(Array.from({ length: 36 }, (_, i) => pickVerseIndex(new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10), 36)));
    expect(all.size).toBe(36);
  });
  it("is safe for bad input", () => {
    expect(pickVerseIndex("nope", 36)).toBe(0);
    expect(pickVerseIndex("2026-11-21", 0)).toBe(0);
    expect(pickVerseIndex("1960-01-01", 36)).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Content gate (runs in CI via `npm test`). Validates Content's delivered
 * files, checks that every message key code depends on exists, and prints a
 * translation-status report.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { formatMessage } from "@/i18n/format";
import { CONTENT_DIR, loadMessages, loadObservances, loadTrustPage, localizeObservance } from "./load";
import { observancesDataSchema, observancesTextSchema, observancesTranslationSchema, uiEnSchema, uiTranslationSchema } from "./schema";
import { TRUST_PAGE_FILES } from "@/lib/routes";
import { FALLBACK_STRINGS } from "@/features/shared/fallback-strings";

const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, rel), "utf8").replace(/^﻿/, "")) as unknown;
const present = (rel: string) => fs.existsSync(path.join(CONTENT_DIR, rel));
const issues = (r: { error?: { issues: unknown[] } }) => r.error?.issues ?? [];

describe("UI strings", () => {
  it("content/en/ui.json exists and is valid", () => {
    expect(issues(uiEnSchema.safeParse(read("en/ui.json")))).toEqual([]);
  });

  for (const l of ["hi", "mr"] as const) {
    it.runIf(present(`${l}/ui.json`))(`content/${l}/ui.json is valid and uses only English keys`, () => {
      const data = read(`${l}/ui.json`);
      expect(issues(uiTranslationSchema.safeParse(data))).toEqual([]);
      const en = [...Object.keys((read("en/ui.json") as { strings: object }).strings), ...Object.keys(FALLBACK_STRINGS)];
      const extra = Object.keys((data as { strings: object }).strings).filter((k) => !en.includes(k));
      expect(extra).toEqual([]);
    });
  }

  it("every English message parses with sample params (no broken ICU)", () => {
    const { messages } = loadMessages("en");
    for (const [k, v] of Object.entries(messages)) {
      const out = formatMessage(v, { count: 2, n: 1, name: "x", time: "6:00", city: "Pune" }, "en");
      expect(out.includes("plural,"), k).toBe(false);
    }
  });

  it("reports translation status (informational until content freeze)", () => {
    const lines = LOCALES.map((l) => {
      const m = loadMessages(l);
      return `${l}: ${Object.keys(m.messages).length} strings, ${m.fallbackCount} showing English`;
    });
    console.info(`[content report]\n  ${lines.join("\n  ")}`);
    expect(lines).toHaveLength(3);
  });
});

describe("observances", () => {
  it.runIf(present("data/observances.json"))("data file is valid (2 sources, known flags, in window)", () => {
    expect(issues(observancesDataSchema.safeParse(read("data/observances.json")))).toEqual([]);
  });

  it.runIf(present("en/observances.json"))("English text exists for every shown item", () => {
    const text = read("en/observances.json");
    expect(issues(observancesTextSchema.safeParse(text))).toEqual([]);
    const data = observancesDataSchema.parse(read("data/observances.json"));
    const t = (text as { items: Record<string, unknown> }).items;
    const missing = data.items.filter((i) => i.status !== "hold" && !t[i.id]).map((i) => i.id);
    expect(missing).toEqual([]);
  });

  it("the loader hides 'hold' items and maps flags to existing UI keys", () => {
    const table = loadObservances("en");
    const { messages } = loadMessages("en");
    const data = present("data/observances.json") ? observancesDataSchema.parse(read("data/observances.json")) : null;
    const held = new Set(data?.items.filter((i) => i.status === "hold").map((i) => i.id) ?? []);
    for (const o of table.items) {
      expect(held.has(o.id)).toBe(false);
      for (const k of o.flagKeys) expect(Object.keys(messages), `flag key ${k}`).toContain(k);
    }
  });

  it("falls back to English per item for hi/mr until reviewed", () => {
    const hi = loadObservances("hi");
    const en = loadObservances("en");
    expect(hi.items.length).toBe(en.items.length);
    for (const o of hi.items) if (o.lang === "en" || o.noteLang === "en") expect(o.fellBack).toBe(true);
  });

  for (const l of ["hi", "mr"] as const) {
    it.runIf(present(`${l}/observances.json`))(`content/${l}/observances.json is valid (notes may be untranslated)`, () => {
      expect(issues(observancesTranslationSchema.safeParse(read(`${l}/observances.json`)))).toEqual([]);
    });
  }
});

describe("observance per-field fallback (D-008)", () => {
  const en = { name: "Tulsi Vivah", note: "English note." };
  it("uses a reviewed name and falls back to the English note when it is missing, blank or noteLang en", () => {
    for (const tr of [
      { name: "तुलसी विवाह", reviewed: true },
      { name: "तुलसी विवाह", note: "  ", reviewed: true },
      { name: "तुलसी विवाह", note: "English note.", noteLang: "en" as const, reviewed: true },
    ]) {
      expect(localizeObservance(en, tr, "hi")).toEqual({ name: "तुलसी विवाह", lang: "hi", note: "English note.", noteLang: "en", fellBack: true });
    }
  });
  it("uses both fields when both are reviewed and translated", () => {
    expect(localizeObservance(en, { name: "तुलसी विवाह", note: "हिंदी", reviewed: true }, "hi")).toMatchObject({ noteLang: "hi", fellBack: false });
  });
  it("shows unreviewed drafts too (D-030)", () => {
    expect(localizeObservance(en, { name: "तुलसी विवाह", note: "हिंदी", reviewed: false }, "hi")).toMatchObject({ name: "तुलसी विवाह", lang: "hi", noteLang: "hi", fellBack: false });
  });
  it("accepts a translation file whose items have no note", () => {
    const file = { $schema: "pranadin-content/1.0", namespace: "observances", lang: "hi", version: "x", status: "final", items: { a: { name: "क", reviewed: true } } };
    expect(observancesTranslationSchema.safeParse(file).success).toBe(true);
  });
});

describe("trust pages", () => {
  it.each(Object.entries(TRUST_PAGE_FILES).filter(([, f]) => f))("%s resolves (content/ or legal/) with valid front matter", (_slug, file) => {
    const page = loadTrustPage("en", file!);
    expect(page?.title.length).toBeGreaterThan(0);
    expect(page!.markdown).not.toMatch(/\{\{feedbackLink\}\}/);
    expect(page!.markdown).not.toMatch(/^>/m); // Legal's internal header is stripped
  });

  it.each(["hi", "mr"] as const)("%s has every trust page, shown as a draft with an official-English line (D-030)", (l) => {
    for (const [, file] of Object.entries(TRUST_PAGE_FILES).filter(([, f]) => f)) {
      const page = loadTrustPage(l, file!);
      expect(page, `${l} ${file}`).toMatchObject({ lang: l, fellBack: false });
      expect(page!.markdown, `${l} ${file}`).toMatch(/^>/m);
    }
  });
});

describe("translation gaps (D-030)", () => {
  it("every English item has Hindi and Marathi text (npm run content:gaps)", async () => {
    const { execFileSync } = await import("node:child_process");
    const out = execFileSync(process.execPath, ["scripts/content-gaps.mjs"], { cwd: process.cwd(), encoding: "utf8" });
    expect(out.match(/TOTAL (\d+)/g)).toEqual(["TOTAL 0", "TOTAL 0"]);
  });
});

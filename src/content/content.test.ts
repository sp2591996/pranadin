/**
 * Content gate (runs in CI via `npm test`):
 * 1. The example files Content can copy are valid.
 * 2. Every file Content has delivered in `app/content/` matches the schema.
 * 3. UI string files use only known keys.
 * 4. A report lists keys still on developer placeholders and HI/MR keys
 *    not yet approved. (Informational now; becomes a hard gate at content freeze.)
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MESSAGE_KEYS } from "@/i18n/catalog";
import { resolveMessages } from "@/i18n/resolve";
import { CONTENT_DIR } from "./load";
import { COLLECTIONS, observancesSchema, uiEnSchema, uiTranslationSchema } from "./schema";

const EXAMPLES = path.join(__dirname, "examples");
const readJson = (f: string) => JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, "")) as unknown;

describe("content examples", () => {
  it("are valid against the schema", () => {
    expect(uiEnSchema.safeParse(readJson(path.join(EXAMPLES, "ui/en.json"))).success).toBe(true);
    expect(uiTranslationSchema.safeParse(readJson(path.join(EXAMPLES, "ui/mr.json"))).success).toBe(true);
    const obs = observancesSchema.safeParse(readJson(path.join(EXAMPLES, "observances/observances.json")));
    expect(obs.error?.issues ?? []).toEqual([]);
  });

  it("rejects a published observance with only one source", () => {
    const file = readJson(path.join(EXAMPLES, "observances/observances.json")) as {
      items: { status: string; provenance: { sources: unknown[] } }[];
    };
    file.items[0]!.status = "published";
    file.items[0]!.provenance.sources = file.items[0]!.provenance.sources.slice(0, 1);
    expect(observancesSchema.safeParse(file).success).toBe(false);
  });

  it("rejects an HI/MR block without a review record", () => {
    const file = readJson(path.join(EXAMPLES, "ui/mr.json")) as { strings: Record<string, { review?: unknown }> };
    delete file.strings["nav.today"]!.review;
    expect(uiTranslationSchema.safeParse(file).success).toBe(false);
  });
});

const present = (rel: string) => fs.existsSync(path.join(CONTENT_DIR, rel));
const ui = ["ui/en.json", "ui/hi.json", "ui/mr.json"] as const;

describe("delivered content in app/content/", () => {
  for (const [rel, schema] of Object.entries(COLLECTIONS)) {
    it.runIf(present(rel))(`${rel} matches the schema`, () => {
      const r = schema.safeParse(readJson(path.join(CONTENT_DIR, rel)));
      expect(r.error?.issues ?? []).toEqual([]);
    });
  }

  for (const rel of ui) {
    it.runIf(present(rel))(`${rel} matches the schema and uses only known keys`, () => {
      const data = readJson(path.join(CONTENT_DIR, rel));
      const schema = rel === "ui/en.json" ? uiEnSchema : uiTranslationSchema;
      const r = schema.safeParse(data);
      expect(r.error?.issues ?? []).toEqual([]);
      const keys = Object.keys((data as { strings: object }).strings);
      const unknown = keys.filter((k) => !(MESSAGE_KEYS as string[]).includes(k));
      expect(unknown, "Unknown keys: ask Dev to add them to src/i18n/catalog.ts").toEqual([]);
    });
  }

  it("reports translation status (informational)", () => {
    const load = (rel: string) => (present(rel) ? (readJson(path.join(CONTENT_DIR, rel)) as never) : null);
    const en = load("ui/en.json");
    const lines: string[] = [];
    for (const locale of ["en", "hi", "mr"] as const) {
      const r = resolveMessages(locale, en, locale === "en" ? null : load(`ui/${locale}.json`));
      const placeholder = MESSAGE_KEYS.filter((k) => r.source[k] === "placeholder").length;
      const english = locale === "en" ? 0 : MESSAGE_KEYS.filter((k) => r.source[k] !== "approved").length;
      lines.push(`${locale}: ${MESSAGE_KEYS.length} keys, ${placeholder} on dev placeholder` + (locale === "en" ? "" : `, ${english} showing English`));
    }
    console.info(`[content report]\n  ${lines.join("\n  ")}`);
    expect(lines).toHaveLength(3);
  });
});

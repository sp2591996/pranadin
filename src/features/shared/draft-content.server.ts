/**
 * Build-time reader for the self-contained D-026 Wave C files
 * (`content/chakras.json`, `content/wisdom.json`). Server Components and
 * tests only (uses `node:fs`). Strings come from the file's own `ui` block.
 */
import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { pickText, type DraftText } from "@/content/draft";
import type { Locale } from "@/i18n/config";

export function readDraftFile<S extends z.ZodType>(file: string, schema: S): z.infer<S> {
  const raw = fs.readFileSync(path.join(process.cwd(), "content", file), "utf8").replace(/^﻿/, "");
  return schema.parse(JSON.parse(raw));
}

/** Strings for `StringsProvider`: draft text shown per D-030, plus the `@localized` list for plural rules. */
export function draftStrings(ui: Record<string, DraftText>, locale: Locale): Record<string, string> {
  const out: Record<string, string> = {};
  const localized: string[] = [];
  for (const [k, v] of Object.entries(ui)) {
    const p = pickText(v, locale);
    out[k] = p.text;
    if (p.lang === locale && locale !== "en") localized.push(k);
  }
  out["@localized"] = localized.join("|");
  return out;
}

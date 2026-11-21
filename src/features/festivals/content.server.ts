import fs from "node:fs";
import path from "node:path";
import { festivalSchema, festivalsUiSchema, pickText, type DraftText, type FestivalsFile } from "@/content/draft";
import { loadObservances } from "@/content/load";
import { draftStrings } from "@/features/shared/draft-content.server";
import type { Locale } from "@/i18n/config";
import type { FestivalView, Txt } from "./types";

const DIR = () => path.join(process.cwd(), "content", "festivals");
const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(path.join(DIR(), file), "utf8").replace(/^﻿/, ""));

let cache: FestivalsFile | null = null;
/** Reads `content/festivals/_ui.json` and every `<id>.json` beside it (one small file per festival). */
export function loadFestivalsFile(): FestivalsFile {
  if (cache) return cache;
  const files = fs.readdirSync(DIR()).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort();
  const festivals = files.map((f) => {
    const fest = festivalSchema.parse(readJson(f));
    if (`${fest.id}.json` !== f) throw new Error(`festivals/${f}: id "${fest.id}" must match the file name`);
    return fest;
  });
  return (cache = { ui: festivalsUiSchema.parse(readJson("_ui.json")).ui, festivals });
}

export const festivalIds = () => loadFestivalsFile().festivals.map((f) => f.id);
export const loadFestivalStrings = (locale: Locale) => draftStrings(loadFestivalsFile().ui, locale);

/** Observance id to festival id, for the "Read the story and how to celebrate" links. */
export function festivalByObservance(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of loadFestivalsFile().festivals) for (const o of f.observances) out[o] = f.id;
  return out;
}

export function loadFestivals(locale: Locale): FestivalView[] {
  const t = (f: DraftText): Txt => pickText(f, locale);
  const shown = new Map(loadObservances(locale).items.map((o) => [o.id, o.date]));
  return loadFestivalsFile().festivals.map((f) => ({
    id: f.id,
    traditions: f.traditions,
    months: f.months,
    name: t(f.name),
    tagline: t(f.tagline),
    story: t(f.story),
    storySource: t(f.storySource),
    why: t(f.why),
    steps: f.steps.map(t),
    regional: t(f.regional),
    foods: t(f.foods),
    note: t(f.note),
    sources: f.sources,
    dates: f.observances.flatMap((o) => (shown.has(o) ? [shown.get(o)!] : [])).sort(),
  }));
}

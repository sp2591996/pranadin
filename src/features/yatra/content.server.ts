import fs from "node:fs";
import path from "node:path";
import { pickText, type DraftText } from "@/content/draft";
import { placeCoreSchema, placeGuideSchema, placeSchema, placeSightsSchema, yatraUiSchema, type PlaceFile } from "@/content/yatra";
import { draftStrings } from "@/features/shared/draft-content.server";
import { loadFestivalsFile } from "@/features/festivals/content.server";
import type { Locale } from "@/i18n/config";
import type { PlaceView, Txt } from "./types";

const DIR = () => path.join(process.cwd(), "content", "yatra");
const readJson = (...p: string[]): unknown => JSON.parse(fs.readFileSync(path.join(DIR(), ...p), "utf8").replace(/^﻿/, ""));

let cache: { ui: ReturnType<typeof yatraUiSchema.parse>["ui"]; places: PlaceFile[] } | null = null;

const ENVELOPE = ["part", "$schema", "namespace", "version", "status", "id"];
/** Strip the envelope keys that only the part files carry. */
const body = (part: object): Record<string, unknown> => Object.fromEntries(Object.entries(part).filter(([k]) => !ENVELOPE.includes(k)));

/** Reads `content/yatra/_ui.json` and, per place folder, `core.json` + `sights.json` + `guide.json`. */
export function loadYatraFile() {
  if (cache) return cache;
  const dirs = fs.readdirSync(DIR(), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const places = dirs.map((d) => {
    const core = placeCoreSchema.parse(readJson(d, "core.json"));
    const sights = placeSightsSchema.parse(readJson(d, "sights.json"));
    const guide = placeGuideSchema.parse(readJson(d, "guide.json"));
    for (const part of [core, sights, guide]) if (part.id !== d) throw new Error(`yatra/${d}: id "${part.id}" must match the folder name`);
    return placeSchema.parse({ ...body(core), ...body(sights), ...body(guide), id: d, $schema: core.$schema, namespace: core.namespace, version: core.version, status: core.status });
  });
  return (cache = { ui: yatraUiSchema.parse(readJson("_ui.json")).ui, places });
}

export const yatraIds = () => loadYatraFile().places.map((p) => p.id);
export const loadYatraStrings = (locale: Locale) => draftStrings(loadYatraFile().ui, locale);

export function loadPlaces(locale: Locale): PlaceView[] {
  const t = (f: DraftText): Txt => pickText(f, locale);
  const fests = new Map(loadFestivalsFile().festivals.map((f) => [f.id, f.name]));
  return loadYatraFile().places.map((p) => ({
    id: p.id,
    name: t(p.name),
    state: t(p.state),
    stateKey: p.stateKey,
    traditions: p.traditions,
    deity: t(p.deity),
    significance: t(p.significance),
    tagline: t(p.tagline),
    overview: t(p.overview),
    story: t(p.story),
    storySource: t(p.storySource),
    bestMonths: p.bestTime.months,
    seasons: p.bestTime.seasons.map((s) => ({ months: s.months, rating: s.rating, weather: t(s.weather) })),
    reach: {
      air: { nearest: t(p.reach.air.nearest), km: p.reach.air.km, how: t(p.reach.air.how) },
      rail: { nearest: t(p.reach.rail.nearest), km: p.reach.rail.km, how: t(p.reach.rail.how) },
      road: { how: t(p.reach.road.how), km: p.reach.road.km },
    },
    localTransport: t(p.localTransport),
    festivals: p.festivals.map((f) => ({ festivalId: f.festivalId, name: t(fests.get(f.festivalId)!), note: t(f.note) })),
    nearby: p.nearby.map((n) => ({ name: t(n.name), km: n.km, note: t(n.note) })),
    photos: p.photos.map((x) => ({ file: x.file, caption: t(x.caption), credit: x.credit, ai: x.ai, ...(x.source ? { source: x.source } : {}) })),
    sources: p.sources,
    sights: p.sights.map((s) => ({ id: s.id, name: t(s.name), desc: t(s.desc), timings: t(s.timings), dress: t(s.dress) })),
    darshan: { tips: p.darshan.tips.map(t), online: t(p.darshan.online) },
    itineraries: p.itineraries
      .map((i) => ({ days: i.days, title: t(i.title), plan: i.plan.map((d) => d.map((x) => ({ part: x.part, text: t(x.text) }))) }))
      .sort((a, b) => a.days - b.days),
    stay: p.stay.map((x) => ({ title: t(x.title), body: t(x.body) })),
    food: p.food.map((x) => ({ title: t(x.title), body: t(x.body) })),
    satvik: t(p.satvik),
    budget: { bands: p.budget.bands, note: t(p.budget.note) },
    health: p.health.map(t),
    etiquette: p.etiquette.map(t),
  }));
}

/**
 * D-026 Wave E: the Yatra (travel) guide. One folder per place in
 * `content/yatra/<id>/` with three part files (`core.json`, `sights.json`,
 * `guide.json`, each small enough to review) plus `content/yatra/_ui.json` for
 * the screen strings. The loader merges the parts and validates the result with
 * `placeSchema`. Text is `{ en, hi, mr }` like the festivals guide (D-030).
 * Information only: no bookings, no named hotels.
 */
import { z } from "zod";
import { CONTENT_SCHEMA_ID } from "./schema";
import { FESTIVAL_TRADITIONS, type DraftText } from "./draft";
import { translatedStringSchema } from "./schema";

const lt = z.object({ en: z.string().min(1), hi: translatedStringSchema, mr: translatedStringSchema });
const sourceLink = z.object({ label: z.string().min(1), url: z.url() });
const id = z.string().regex(/^[a-z0-9-]+$/);
const km = z.number().int().min(0).max(5000);

export const YATRA_TRADITIONS = FESTIVAL_TRADITIONS;
export const DAY_PARTS = ["morning", "afternoon", "evening"] as const;
export const BUDGET_BANDS = ["budget", "mid", "comfort"] as const;
const range = z.object({ min: z.number().int().min(0), max: z.number().int().min(0) }).refine((r) => r.max >= r.min, "max < min");

const gateway = z.object({ nearest: lt, km, how: lt });

export const sightSchema = z.object({
  id,
  name: lt,
  desc: lt,
  /** Typical opening times. The UI always adds "check locally". */
  timings: lt,
  dress: lt,
});

export const itinerarySchema = z
  .object({
    days: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    title: lt,
    /** One entry per day; each day is a list of parts of the day. */
    plan: z.array(z.array(z.object({ part: z.enum(DAY_PARTS), text: lt })).min(2)).min(1),
  })
  .refine((i) => i.plan.length === i.days, "plan must have one entry per day");

const titled = z.object({ title: lt, body: lt });

const header = {
  $schema: z.literal(CONTENT_SCHEMA_ID),
  namespace: z.literal("yatra"),
  version: z.string().min(1),
  status: z.string().min(1),
  id,
};

export const placeCoreSchema = z.object({
  ...header,
  part: z.literal("core"),
  name: lt,
  state: lt,
  /** Filter key for the state, e.g. `uttar-pradesh`. */
  stateKey: id,
  traditions: z.array(z.enum(YATRA_TRADITIONS)).min(1),
  deity: lt,
  significance: lt,
  tagline: lt,
  overview: lt,
  story: lt,
  storySource: lt,
  bestTime: z.object({
    /** Gregorian months (1-12) that suit a first visit. Used by the month filter. */
    months: z.array(z.number().int().min(1).max(12)).min(1),
    /** Together the seasons cover all 12 months exactly once. */
    seasons: z
      .array(z.object({ months: z.array(z.number().int().min(1).max(12)).min(1), rating: z.enum(["best", "good", "difficult"]), weather: lt }))
      .min(3),
  }),
  reach: z.object({ air: gateway, rail: gateway, road: z.object({ how: lt, km }) }),
  localTransport: lt,
  festivals: z.array(z.object({ festivalId: id, note: lt })),
  nearby: z.array(z.object({ name: lt, km, note: lt })).min(2),
  /** Files sit in `public/yatra/<id>/`. Real photos replace AI ones later: set `ai` false and give the credit. */
  photos: z.array(z.object({ file: z.string().regex(/^[a-z0-9-]+\.webp$/), caption: lt, credit: z.string().min(1), ai: z.boolean() })),
  sources: z.array(sourceLink).min(2),
});

export const placeSightsSchema = z.object({
  ...header,
  part: z.literal("sights"),
  sights: z.array(sightSchema).min(4),
  darshan: z.object({ tips: z.array(lt).min(4), online: lt }),
});

export const placeGuideSchema = z.object({
  ...header,
  part: z.literal("guide"),
  itineraries: z.array(itinerarySchema).length(3),
  stay: z.array(titled).min(3),
  food: z.array(titled).min(3),
  satvik: lt,
  budget: z.object({ bands: z.object({ budget: range, mid: range, comfort: range }), note: lt }),
  health: z.array(lt).min(3),
  etiquette: z.array(lt).min(4),
});

const strip = { part: true, $schema: true, namespace: true, version: true, status: true, id: true } as const;
const coreShape = placeCoreSchema.omit({ part: true }).shape;
const sightsShape = placeSightsSchema.omit(strip).shape;
const guideShape = placeGuideSchema.omit(strip).shape;
export const placeSchema = z
  .object({ ...coreShape, ...sightsShape, ...guideShape })
  .superRefine((p, ctx) => {
    const seen = new Map<number, number>();
    for (const s of p.bestTime.seasons) for (const m of s.months) seen.set(m, (seen.get(m) ?? 0) + 1);
    for (let m = 1; m <= 12; m++)
      if (seen.get(m) !== 1) ctx.addIssue({ code: "custom", path: ["bestTime", "seasons"], message: `Month ${m} must be in exactly one season` });
    const days = p.itineraries.map((i) => i.days).sort();
    if (days.join() !== "1,2,3") ctx.addIssue({ code: "custom", path: ["itineraries"], message: "Need exactly a 1-day, 2-day and 3-day itinerary" });
    if (p.photos.some((x) => !x.ai && x.credit.trim().length < 3)) ctx.addIssue({ code: "custom", path: ["photos"], message: "Real photos need a credit" });
  });
export type PlaceFile = z.infer<typeof placeSchema>;
export type PlaceText = DraftText;

export const yatraUiSchema = z.object({
  $schema: z.literal(CONTENT_SCHEMA_ID),
  namespace: z.literal("yatra-ui"),
  version: z.string().min(1),
  status: z.string().min(1),
  ui: z.record(z.string(), lt),
});

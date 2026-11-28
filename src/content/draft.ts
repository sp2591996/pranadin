/**
 * D-026 Wave C: `content/chakras.json` and `content/wisdom.json`. Each file
 * carries its own `ui` strings and per-item text as `{ en, hi, mr }`, where
 * hi/mr are `{ text, reviewed }`. Board D-030: HI/MR draft text is SHOWN
 * whatever `reviewed` says (see `pickText`). zod runs at build and test time.
 */
import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { CONTENT_SCHEMA_ID, translatedStringSchema } from "./schema";

const localizedText = z.object({
  en: z.string().min(1),
  hi: translatedStringSchema,
  mr: translatedStringSchema,
});
export type LocalizedText = z.infer<typeof localizedText>;

const sourceLink = z.object({ label: z.string().min(1), url: z.url() });
const envelope = {
  $schema: z.literal(CONTENT_SCHEMA_ID),
  version: z.string().min(1),
  status: z.string().min(1),
  note: z.string().optional(),
  ui: z.record(z.string(), localizedText),
};

export const chakraSchema = z.object({
  id: z.string().regex(/^[a-z]+$/),
  n: z.number().int().min(1).max(7),
  sa: z.string().min(1),
  iast: z.string().min(1),
  petals: z.number().int().min(1),
  bija: z.object({ sa: z.string().min(1), iast: z.string().min(1) }).nullable(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  nick: localizedText,
  meaning: localizedText,
  location: localizedText,
  element: localizedText,
  colour: localizedText,
  about: localizedText,
  practice: localizedText,
  affirmation: localizedText,
  sources: z.array(sourceLink).min(1),
});

export const chakrasSchema = z
  .object({ ...envelope, namespace: z.literal("chakras"), chakras: z.array(chakraSchema).length(7) })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.chakras.forEach((c, i) => {
      if (ids.has(c.id)) ctx.addIssue({ code: "custom", path: ["chakras", i, "id"], message: `Duplicate id ${c.id}` });
      ids.add(c.id);
      if (c.n !== i + 1) ctx.addIssue({ code: "custom", path: ["chakras", i, "n"], message: "Chakras must be in order 1 to 7" });
    });
  });
export type ChakrasFile = z.infer<typeof chakrasSchema>;

export const VERSE_TRADITIONS = ["gita", "upanishad", "yoga-sutras", "dhammapada", "granth", "dnyaneshwari"] as const;

export const verseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  tradition: z.enum(VERSE_TRADITIONS),
  work: z.string().min(1),
  reference: z.string().min(1),
  by: z.string().min(1).optional(),
  script: z.object({ lang: z.enum(["sa", "pi", "pa", "mr", "hi"]), text: z.string().min(1) }),
  transliteration: z.string().min(1).optional(),
  meaning: localizedText,
  note: localizedText.optional(),
  sources: z.array(sourceLink).min(1),
  verifiedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Verse = z.infer<typeof verseSchema>;

export const wisdomSchema = z
  .object({ ...envelope, namespace: z.literal("wisdom"), verses: z.array(verseSchema).min(1) })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.verses.forEach((v, i) => {
      if (ids.has(v.id)) ctx.addIssue({ code: "custom", path: ["verses", i, "id"], message: `Duplicate id ${v.id}` });
      ids.add(v.id);
      if (!file.ui[`wisdom.tradition.${v.tradition}`])
        ctx.addIssue({ code: "custom", path: ["verses", i, "tradition"], message: `No ui label for ${v.tradition}` });
    });
  });
export type WisdomFile = z.infer<typeof wisdomSchema>;

/** `{ en, hi, mr }` text as stored in the files. */
export interface DraftText {
  en: string;
  hi?: { text: string; reviewed?: boolean };
  mr?: { text: string; reviewed?: boolean };
}

/**
 * Board D-030: HI/MR draft text is SHOWN, whether or not `reviewed` is set.
 * Only a missing or blank translation falls back to English, and `lang` says
 * which language the returned text is in (for the `lang` attribute).
 */
export function pickText(field: DraftText, locale: Locale): { text: string; lang: Locale } {
  if (locale !== "en") {
    const t = field[locale]?.text?.trim();
    if (t) return { text: t, lang: locale };
  }
  return { text: field.en, lang: "en" };
}

/**
 * D-026 Wave D: the Festivals guide. One small file per festival in
 * `content/festivals/<id>.json` (en, hi and mr together) plus `content/festivals/_ui.json`
 * for the screen strings. Same `{ en, hi, mr }` pattern as chakras.
 */
export const FESTIVAL_TRADITIONS = ["hindu", "sikh", "jain", "buddhist", "christian", "islamic", "parsi"] as const;

export const festivalSchema = z.object({
  $schema: z.literal(CONTENT_SCHEMA_ID),
  namespace: z.literal("festival"),
  version: z.string().min(1),
  status: z.string().min(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  traditions: z.array(z.enum(FESTIVAL_TRADITIONS)).min(1),
  /** Gregorian months (1-12) in which the festival usually falls; dates vary by calendar. */
  months: z.array(z.number().int().min(1).max(12)).min(1),
  /** Ids in data/observances.json (may be empty or hidden). */
  observances: z.array(z.string()),
  name: localizedText,
  tagline: localizedText,
  /** Where the story comes from: text or tradition. */
  story: localizedText,
  storySource: localizedText,
  why: localizedText,
  steps: z.array(localizedText).min(5),
  regional: localizedText,
  foods: localizedText,
  note: localizedText,
  sources: z.array(sourceLink).min(2),
});
export type FestivalFile = z.infer<typeof festivalSchema>;

export const festivalsUiSchema = z.object({
  $schema: z.literal(CONTENT_SCHEMA_ID),
  namespace: z.literal("festivals-ui"),
  version: z.string().min(1),
  status: z.string().min(1),
  ui: z.record(z.string(), localizedText),
});

export interface FestivalsFile {
  ui: Record<string, LocalizedText>;
  festivals: FestivalFile[];
}

/* ------------------------------ Stories (D-038) ------------------------------ */

export const STORY_TRADITIONS = ["hindu", "sikh", "buddhist", "jain", "christian", "islamic", "parsi"] as const;
export const STORY_REGIONS = ["india", "maharashtra", "punjab", "bihar", "world"] as const;

const storyImage = z.object({
  /** Path under public/, e.g. /stories/ramayana/1.webp or a yatra photo. */
  src: z.string().regex(/^\/(stories|yatra)\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  caption: localizedText,
  credit: z.string().min(1),
  source: z.url(),
});

/**
 * One chapter of a story collection (D-040). Lives in content/stories/<collection>/<id>.json.
 * Scene text may hold paragraphs separated by a blank line.
 */
export const storySchema = z.object({
  $schema: z.literal(CONTENT_SCHEMA_ID),
  namespace: z.literal("story"),
  version: z.string().min(1),
  status: z.string().min(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Chapter order inside the collection. */
  order: z.number().int(),
  /** Part of the collection (e.g. a kanda); must be one of the collection's parts. */
  part: z.string().optional(),
  /** Yatra place id and festival id, for cross-links (optional). */
  place: z.string().optional(),
  festival: z.string().optional(),
  figure: localizedText,
  title: localizedText,
  teaser: localizedText,
  images: z.array(storyImage).min(1),
  scenes: z
    .array(z.object({ title: localizedText, text: localizedText, image: z.number().int().min(0).optional() }))
    .min(3),
  /** A verse in the original language (not translated), with where it is from and its meaning. */
  verse: z
    .object({
      text: z.string().min(1),
      /** Language of the original text (BCP 47): Sanskrit by default, Marathi for ovis. */
      lang: z.enum(["sa", "mr", "hi", "awa", "en", "pi", "pa"]).default("sa"),
      cite: localizedText,
      meaning: localizedText,
    })
    .optional(),
  /** "Pause and reflect": a short question or practice for the reader. */
  reflect: localizedText.optional(),
  lesson: localizedText,
  source: localizedText,
});
export type StoryFile = z.infer<typeof storySchema>;

/** Story collections ("clubs", D-040): Ramayana, Mahabharata, Gurucharitra and so on. */
export const storyClubsSchema = z.object({
  $schema: z.literal(CONTENT_SCHEMA_ID),
  namespace: z.literal("story-clubs"),
  version: z.string().min(1),
  status: z.string().min(1),
  clubs: z.array(
    z.object({
      id: z.string().regex(/^[a-z0-9-]+$/),
      order: z.number().int(),
      tradition: z.enum(STORY_TRADITIONS),
      region: z.enum(STORY_REGIONS),
      title: localizedText,
      subtitle: localizedText,
      intro: localizedText,
      /** Chapter whose first picture is the collection cover (default: chapter 1). */
      cover: z.string().optional(),
      /** More chapters are being written. */
      growing: z.boolean().default(false),
      parts: z.array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), title: localizedText })).default([]),
    }),
  ),
});
export type StoryClubsFile = z.infer<typeof storyClubsSchema>;

export const storiesUiSchema = z.object({
  $schema: z.literal(CONTENT_SCHEMA_ID),
  namespace: z.literal("stories-ui"),
  version: z.string().min(1),
  status: z.string().min(1),
  ui: z.record(z.string(), localizedText),
});

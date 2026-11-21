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

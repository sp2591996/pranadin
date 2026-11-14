/**
 * Content JSON schema (E-02 contract, proposed for C1). Content owns the
 * files in `app/content/`; Engineering owns this schema. Validated in CI
 * (`src/content/content.test.ts`) and at build time by the loader.
 * zod runs only at build and test time; it is never shipped to the browser.
 *
 * Shape in one line: every collection file is
 *   { schemaVersion: 1, items: [ { id, status, aiAssisted, provenance, i18n: { en, hi?, mr? }, ...fields } ] }
 * and every HI/MR block carries a `review` record. Only `status: "published"`
 * items ship, and an HI/MR block is used only when `review.status` is
 * "approved"; otherwise that item falls back to English (per item, D-008).
 */
import { z } from "zod";
import { GOALS, MOODS, PRACTICE_KINDS, TRADITIONS } from "@/lib/types";

export const SCHEMA_VERSION = 1 as const;

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase-kebab-case ids");

export const reviewSchema = z.object({
  status: z.enum(["pending", "changes_requested", "approved"]),
  /** Reviewer id, e.g. "board" (D-012). */
  by: z.string().min(1),
  on: dateKey,
  note: z.string().optional(),
});
export type Review = z.infer<typeof reviewSchema>;

export const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.url().optional(),
  /** Edition / publisher / translator for scripture. */
  edition: z.string().optional(),
  /** Chapter.verse or page reference. */
  ref: z.string().optional(),
  accessedOn: dateKey.optional(),
});

export const provenanceSchema = z.object({
  sources: z.array(sourceSchema).min(1),
  checkedOn: dateKey,
  subjectReviewer: z.string().nullable().default(null),
  translator: z.string().nullable().default(null),
  notes: z.string().optional(),
});

export const itemStatusSchema = z.enum(["draft", "in_review", "published"]);

/** Build the `i18n` block for a collection from its English field shape. */
function i18nBlock<T extends z.ZodRawShape>(fields: T) {
  const en = z.object(fields);
  const other = en.partial().extend({ review: reviewSchema });
  return z.object({ en, hi: other.optional(), mr: other.optional() });
}

function collection<T extends z.ZodRawShape, F extends z.ZodRawShape>(fields: T, localized: F) {
  const item = z.object({
    id,
    status: itemStatusSchema,
    aiAssisted: z.boolean(),
    provenance: provenanceSchema,
    i18n: i18nBlock(localized),
    ...fields,
  });
  return z.object({ schemaVersion: z.literal(SCHEMA_VERSION), items: z.array(item) });
}

// ---------- UI strings: app/content/ui/{en,hi,mr}.json ----------

export const uiEnSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  strings: z.record(z.string(), z.string()),
});

export const uiTranslationSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  strings: z.record(z.string(), z.object({ text: z.string(), review: reviewSchema })),
});

// ---------- Collections ----------

/** app/content/observances/observances.json (C7). Two sources per date. */
export const observancesSchema = collection(
  {
    date: dateKey,
    endDate: dateKey.optional(),
    tradition: z.enum(TRADITIONS),
    /** Show "dates may vary by region". */
    datesVary: z.boolean(),
    /** Islamic dates: "may vary by moon sighting" (FR-9.3). */
    moonSighting: z.boolean().default(false),
    regions: z.array(z.string()).default([]),
  },
  { name: z.string().min(1), note: z.string().min(1).max(240) },
).superRefine((file, ctx) => {
  file.items.forEach((it, i) => {
    if (it.status === "published" && it.provenance.sources.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["items", i, "provenance", "sources"],
        message: "Published observances need at least 2 sources (ADR-008)",
      });
    }
  });
});

/** app/content/wisdom/wisdom.json (F12: daily wisdom card). */
export const wisdomSchema = collection(
  {
    tradition: z.enum(TRADITIONS),
    original: z.object({
      /** BCP 47 language of the original, e.g. "sa", "mr", "pa", "pi". */
      lang: z.string().min(2),
      text: z.string().min(1),
    }),
    transliteration: z.string().min(1),
    citation: z.object({ work: z.string().min(1), ref: z.string().min(1) }),
  },
  { translation: z.string().min(1), sourceLine: z.string().min(1) },
);

const phaseSchema = z.object({
  phase: z.enum(["inhale", "hold", "exhale", "hum"]),
  seconds: z.number().positive().max(20),
});

/** app/content/practices/breath.json (C4: 4 techniques, no retention). */
export const breathSchema = collection(
  {
    pattern: z.array(phaseSchema).min(2),
    goals: z.array(z.enum(GOALS)).min(1),
  },
  {
    name: z.string().min(1),
    summary: z.string().min(1).max(200),
    steps: z.array(z.string().min(1)).min(1).max(5),
    caution: z.string().min(1),
  },
);

/** app/content/practices/stillness.json (C4: meditation focus scripts). */
export const stillnessSchema = collection(
  { ambience: z.enum(["silence", "rain", "river"]), goals: z.array(z.enum(GOALS)).min(1) },
  { name: z.string().min(1), guidance: z.string().min(1) },
);

/** app/content/plan/cards.json (C5: 12 cards, 7-day rotation). */
export const planCardsSchema = collection(
  {
    kind: z.enum(PRACTICE_KINDS),
    /** Technique / focus id this card starts, if any. */
    refId: id.nullable(),
    goals: z.array(z.enum(GOALS)).min(1),
    /** 1..7: which day of the rotation this card belongs to; empty = any day. */
    rotationDays: z.array(z.number().int().min(1).max(7)).default([]),
  },
  { title: z.string().min(1).max(40), body: z.string().min(1).max(140) },
);

/** app/content/journal/prompts.json (C8: 30 prompts). */
export const journalPromptsSchema = collection(
  { kind: z.enum(["gratitude", "intention", "reflection"]) },
  { text: z.string().min(1).max(160) },
);

/** app/content/journal/moods.json (C8). Item ids must be the Mood ids. */
export const moodsSchema = collection({}, { label: z.string().min(1).max(24) }).superRefine((file, ctx) => {
  file.items.forEach((it, i) => {
    if (!(MOODS as readonly string[]).includes(it.id)) {
      ctx.addIssue({ code: "custom", path: ["items", i, "id"], message: `Mood id must be one of ${MOODS.join(", ")}` });
    }
  });
});

/** app/content/glossary/panchang.json (F09: 30 tithi, 2 paksha, 27 nakshatra, 12 masa). */
export const glossarySchema = collection(
  {
    kind: z.enum(["tithi", "paksha", "nakshatra", "masa"]),
    /** Engine index: tithi 0..29, paksha 0..1, nakshatra 0..26, masa 0..11. */
    index: z.number().int().min(0).max(29),
  },
  { name: z.string().min(1), explainer: z.string().max(200).optional() },
);

/** app/content/trust/<slug>.json (C9, L1). One file per page; items = sections. */
export const trustPageSchema = collection(
  { order: z.number().int().min(0) },
  {
    heading: z.string().optional(),
    paragraphs: z.array(z.string().min(1)).min(1),
  },
);

export const COLLECTIONS = {
  "observances/observances.json": observancesSchema,
  "wisdom/wisdom.json": wisdomSchema,
  "practices/breath.json": breathSchema,
  "practices/stillness.json": stillnessSchema,
  "plan/cards.json": planCardsSchema,
  "journal/prompts.json": journalPromptsSchema,
  "journal/moods.json": moodsSchema,
  "glossary/panchang.json": glossarySchema,
} as const;
export type CollectionPath = keyof typeof COLLECTIONS;

export type ObservanceFile = z.infer<typeof observancesSchema>;
export type ObservanceItem = ObservanceFile["items"][number];

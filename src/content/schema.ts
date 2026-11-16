/**
 * Validation for Content's files (`pranadin-content/1.0`, C1). Content owns
 * the files in `app/content/` and their format; Engineering adopted it on
 * 17 Nov and validates it here. zod runs only at build and test time; it is
 * never shipped to the browser.
 *
 * Layout:
 *   content/data/<ns>.json       language-neutral data (dates, ids, sources)
 *   content/<lang>/<ns>.json     text per language; en is final, hi/mr arrive
 *                                only after Board review (reviewed: true)
 *   content/<lang>/pages/*.md    trust pages (front matter + Markdown)
 */
import { z } from "zod";

export const CONTENT_SCHEMA_ID = "pranadin-content/1.0";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const envelope = {
  $schema: z.literal(CONTENT_SCHEMA_ID),
  namespace: z.string().min(1),
  lang: z.enum(["en", "hi", "mr", "none"]),
  version: z.string().min(1),
  status: z.string().min(1),
};

export const uiEnSchema = z.object({ ...envelope, lang: z.literal("en"), strings: z.record(z.string(), z.string()) });

export const translatedStringSchema = z.object({
  text: z.string(),
  reviewed: z.boolean(),
  reviewer: z.string().nullable().optional(),
  reviewedOn: dateKey.nullable().optional(),
});
export const uiTranslationSchema = z.object({
  ...envelope,
  lang: z.enum(["hi", "mr"]),
  strings: z.record(z.string(), translatedStringSchema),
});

export const OBSERVANCE_TRADITIONS = [
  "hindu",
  "sikh",
  "jain",
  "buddhist",
  "christian",
  "islamic",
  "jewish",
  "parsi",
  "national",
] as const;
export type ObservanceTradition = (typeof OBSERVANCE_TRADITIONS)[number];

export const observanceDataItemSchema = z.object({
  id: z.string().regex(/^obs\.\d{4}\.[a-z0-9-]+$/),
  date: dateKey,
  endDate: dateKey.optional(),
  traditions: z.array(z.enum(OBSERVANCE_TRADITIONS)).min(1),
  /** verified/variable are shown; hold is never shown (FR-9.2). */
  status: z.enum(["verified", "variable", "hold"]),
  flags: z.array(z.string()),
  sources: z.array(z.string()),
  check: z.string().optional(),
});

export const observancesDataSchema = z
  .object({
    ...envelope,
    lang: z.literal("none"),
    window: z.object({ from: dateKey, to: dateKey }),
    flags: z.record(z.string(), z.string()),
    sourceKey: z.record(z.string(), z.object({ name: z.string().min(1), url: z.url() })),
    items: z.array(observanceDataItemSchema),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.items.forEach((it, i) => {
      const at = (k: string) => ["items", i, k];
      if (ids.has(it.id)) ctx.addIssue({ code: "custom", path: at("id"), message: `Duplicate id ${it.id}` });
      ids.add(it.id);
      for (const s of it.sources)
        if (!file.sourceKey[s]) ctx.addIssue({ code: "custom", path: at("sources"), message: `Unknown source ${s}` });
      for (const f of it.flags)
        if (!file.flags[f]) ctx.addIssue({ code: "custom", path: at("flags"), message: `Unknown flag ${f}` });
      if (it.status !== "hold" && it.sources.length < 2)
        ctx.addIssue({ code: "custom", path: at("sources"), message: "Shown observances need 2 sources (ADR-008)" });
      if (it.status === "variable" && it.flags.length === 0)
        ctx.addIssue({ code: "custom", path: at("flags"), message: "'variable' items must carry a flag" });
      if (it.date < file.window.from || it.date > file.window.to)
        ctx.addIssue({ code: "custom", path: at("date"), message: "Date outside the verified window" });
      if (it.endDate && it.endDate < it.date)
        ctx.addIssue({ code: "custom", path: at("endDate"), message: "endDate before date" });
    });
  });
export type ObservancesData = z.infer<typeof observancesDataSchema>;

const observanceText = z.object({ name: z.string().min(1), note: z.string().min(1) });
/** English observance text: name and note are both required. */
export const observancesTextSchema = z.object({
  ...envelope,
  items: z.record(z.string(), observanceText.extend({ reviewed: z.boolean().optional() })),
  reviewed: z.boolean().optional(),
});
export type ObservancesText = z.infer<typeof observancesTextSchema>;

/**
 * HI/MR observance text. Only `name` is required: an untranslated note may be
 * missing, blank, or marked `noteLang: "en"`, and the app shows the English
 * note for that item (D-008, per-item fallback). Never a validation error.
 */
export const observancesTranslationSchema = z.object({
  ...envelope,
  items: z.record(
    z.string(),
    z.object({
      name: z.string().min(1),
      note: z.string().optional(),
      noteLang: z.enum(["en", "hi", "mr"]).optional(),
      reviewed: z.boolean().optional(),
      reviewer: z.string().optional(),
      reviewedOn: z.string().optional(),
    }),
  ),
  reviewed: z.boolean().optional(),
});
export type ObservancesTranslation = z.infer<typeof observancesTranslationSchema>;

/** Trust page front matter (`content/<lang>/pages/<slug>.md`). */
export const pageFrontMatterSchema = z.object({
  id: z.string().regex(/^page\.[a-z0-9-]+$/),
  title: z.string().min(1),
  lang: z.enum(["en", "hi", "mr"]),
  version: z.string().min(1),
  status: z.string().min(1),
  reviewed: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
});

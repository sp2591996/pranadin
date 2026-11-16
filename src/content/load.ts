/**
 * Build-time content loader. Import ONLY from Server Components, scripts or
 * tests (it uses `node:fs` and zod). Pages read content here during
 * `next build` and pass plain, already-localized data to Client Components,
 * so the browser gets only the active locale and no validator code.
 *
 * `content/en/ui.json` is required. Other files are optional (Content may not
 * have delivered them); invalid files throw, which fails the build.
 */
import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import type { Locale } from "@/i18n/config";
import { resolveMessages, type ResolvedMessages } from "@/i18n/resolve";
import {
  observancesDataSchema,
  observancesTextSchema,
  observancesTranslationSchema,
  pageFrontMatterSchema,
  uiEnSchema,
  uiTranslationSchema,
  type ObservanceTradition,
  type ObservancesTranslation,
} from "./schema";

export const CONTENT_DIR = path.join(process.cwd(), "content");
/** Legal's final policies, copied by `scripts/sync-legal.mjs` (privacy, terms, help). English only. */
export const LEGAL_DIR = path.join(process.cwd(), "legal");

/**
 * Feedback/contact link that replaces `{{feedbackLink}}` in pages (SCHEMA.md
 * rule 6). Still to be supplied by the PMO (D-022). While null, the link
 * renders as plain text, so no dead or guessed URL ships.
 */
export const FEEDBACK_LINK: string | null = null;

function readJson(rel: string): unknown | null {
  const file = path.join(CONTENT_DIR, rel);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`content/${rel}: invalid JSON (${(e as Error).message})`);
  }
}

export function parseOrThrow<S extends z.ZodType>(schema: S, rel: string, data: unknown): z.infer<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const issues = r.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`content/${rel} does not match the schema:\n${issues}`);
  }
  return r.data;
}

function load<S extends z.ZodType>(schema: S, rel: string): z.infer<S> | null {
  const data = readJson(rel);
  return data === null ? null : parseOrThrow(schema, rel, data);
}

const messagesCache = new Map<Locale, ResolvedMessages & { fallbackCount: number }>();

/** Resolved UI strings for a locale, memoised for the build. */
export function loadMessages(locale: Locale): ResolvedMessages & { fallbackCount: number } {
  const hit = messagesCache.get(locale);
  if (hit) return hit;
  const en = load(uiEnSchema, "en/ui.json");
  if (!en) throw new Error("content/en/ui.json is missing; the app cannot build without UI strings");
  const tr = locale === "en" ? null : load(uiTranslationSchema, `${locale}/ui.json`);
  const resolved = resolveMessages(locale, en, tr);
  const fallbackCount = locale === "en" ? 0 : Object.values(resolved.source).filter((s) => s === "en").length;
  const out = { ...resolved, fallbackCount };
  messagesCache.set(locale, out);
  return out;
}

/** Observance ready for the client: only shown items, localized, with flag message keys. */
export interface Observance {
  id: string;
  date: string;
  endDate: string | null;
  traditions: ObservanceTradition[];
  status: "verified" | "variable";
  /** UI message keys explaining each flag (e.g. `cal.obs.moon`). */
  flagKeys: string[];
  name: string;
  note: string;
  /** Language of `name` (use as the item's `lang`). */
  lang: Locale;
  /** Language of `note`; can be "en" while the name is translated (D-008). */
  noteLang: Locale;
  /** True if any field is shown in English on a hi/mr page. */
  fellBack: boolean;
  sources: { name: string; url: string }[];
}

type TrItem = ObservancesTranslation["items"][string];

/**
 * Per-field localisation of one observance (D-008). The translated name is
 * used only if reviewed; the translated note only if reviewed, non-blank and
 * not marked `noteLang: "en"`. Anything else falls back to English.
 */
export function localizeObservance(
  en: { name: string; note: string },
  tr: TrItem | undefined,
  locale: Locale,
  fileReviewed = false,
): Pick<Observance, "name" | "note" | "lang" | "noteLang" | "fellBack"> {
  const english = { name: en.name, note: en.note, lang: "en" as Locale, noteLang: "en" as Locale };
  if (locale === "en") return { ...english, fellBack: false };
  const ok = tr && (tr.reviewed === true || (fileReviewed && tr.reviewed !== false));
  if (!ok) return { ...english, fellBack: true };
  const noteOk = !!tr.note?.trim() && (tr.noteLang ?? locale) === locale;
  return {
    name: tr.name,
    lang: locale,
    note: noteOk ? tr.note! : en.note,
    noteLang: noteOk ? locale : "en",
    fellBack: !noteOk,
  };
}

export interface ObservanceTable {
  window: { from: string; to: string };
  items: Observance[];
}

/**
 * Curated observance table (C7, E-06). `hold` items are dropped (FR-9.2);
 * items without English text are dropped too (never show a bare id).
 */
export function loadObservances(locale: Locale): ObservanceTable {
  const data = load(observancesDataSchema, "data/observances.json");
  if (!data) return { window: { from: "1970-01-01", to: "1970-01-01" }, items: [] };
  const en = load(observancesTextSchema, "en/observances.json");
  const tr = locale === "en" ? null : load(observancesTranslationSchema, `${locale}/observances.json`);
  const items: Observance[] = [];
  for (const it of data.items) {
    if (it.status === "hold") continue;
    const enText = en?.items[it.id];
    if (!enText) continue;
    const text = localizeObservance(enText, tr?.items[it.id], locale, tr?.reviewed === true);
    items.push({
      id: it.id,
      date: it.date,
      endDate: it.endDate ?? null,
      traditions: it.traditions,
      status: it.status,
      flagKeys: it.flags.map((f) => data.flags[f]!),
      name: text.name,
      note: text.note,
      lang: text.lang,
      noteLang: text.noteLang,
      fellBack: text.fellBack,
      sources: it.sources.map((s) => data.sourceKey[s]!),
    });
  }
  items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
  return { window: data.window, items };
}

export interface TrustPageContent {
  title: string;
  markdown: string;
  lang: Locale;
  fellBack: boolean;
}

function pageFile(lang: Locale, slug: string): string | null {
  const content = path.join(CONTENT_DIR, lang, "pages", `${slug}.md`);
  if (fs.existsSync(content)) return content;
  const legal = path.join(LEGAL_DIR, lang, `${slug}.md`);
  return fs.existsSync(legal) ? legal : null;
}

function readPage(lang: Locale, slug: string) {
  const file = pageFile(lang, slug);
  if (!file) return null;
  const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`content/${lang}/pages/${slug}.md: missing front matter`);
  const fm: Record<string, string> = {};
  for (const line of m[1]!.split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) fm[kv[1]!] = kv[2]!.replace(/^"(.*)"$/, "$1");
  }
  const meta = parseOrThrow(pageFrontMatterSchema, `${lang}/pages/${slug}.md`, fm);
  const body = m[2]!.replace(/\(\{\{feedbackLink\}\}\)/g, FEEDBACK_LINK ? `(${FEEDBACK_LINK})` : "(#feedback-pending)");
  return { meta, body };
}

/** Trust page (C9). HI/MR pages are used only if their front matter says `reviewed: true`. */
export function loadTrustPage(locale: Locale, slug: string): TrustPageContent | null {
  if (locale !== "en") {
    const tr = readPage(locale, slug);
    if (tr && String(tr.meta.reviewed) === "true") {
      return { title: tr.meta.title, markdown: tr.body, lang: locale, fellBack: false };
    }
  }
  const en = readPage("en", slug);
  if (!en) return null;
  return { title: en.meta.title, markdown: en.body, lang: "en", fellBack: locale !== "en" };
}

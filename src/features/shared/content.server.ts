/**
 * Build-time reader for Content's delivered files (`app/content/en/*.json`,
 * `app/content/data/practices.json`). Import only from Server Components
 * (page.tsx) or tests: it uses `node:fs`. Pages pass plain, localized data
 * to Client Components.
 *
 * Format: `app/content/SCHEMA.md` (pranadin-content/1.0).
 * HI/MR: a `content/{hi,mr}/<file>.json` is used per item only when that
 * item carries `reviewed: true` (D-008, D-012).
 * Otherwise the English text is used, item by item.
 */
import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/i18n/config";
import { FALLBACK_STRINGS } from "./fallback-strings";

const CONTENT_DIR = path.join(process.cwd(), "content");

type Json = Record<string, unknown>;

function readJson(rel: string): Json | null {
  const file = path.join(CONTENT_DIR, rel);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")) as Json;
  } catch (e) {
    throw new Error(`content/${rel}: invalid JSON (${(e as Error).message})`);
  }
}

/** `content/SCHEMA.md`: HI/MR entries carry `reviewed: true` once the Board approves them (D-012). */
const approved = (x: unknown): boolean =>
  !!x &&
  typeof x === "object" &&
  ((x as { reviewed?: unknown }).reviewed === true || (x as { review?: { status?: string } }).review?.status === "approved");

/**
 * Pick a localized value. `tr` may be a plain value (used only if the whole
 * file is approved) or `{ text, review }`.
 */
function pickLocalized<T>(en: T, tr: unknown, fileApproved: boolean): T {
  if (tr === undefined || tr === null) return en;
  if (typeof tr === "object" && tr !== null && "text" in tr && approved(tr)) return (tr as { text: T }).text;
  if (fileApproved && typeof tr === typeof en) return tr as T;
  return en;
}

function localizedFile(name: string, locale: Locale): { en: Json; tr: Json | null; trApproved: boolean } {
  const en = readJson(`en/${name}`) ?? {};
  const tr = locale === "en" ? null : readJson(`${locale}/${name}`);
  return { en, tr, trApproved: approved(tr) };
}

export type Strings = Record<string, string>;

/** UI strings whose keys start with any of `prefixes` (plus `common.`), with developer fallbacks. */
export function loadStrings(locale: Locale, prefixes: readonly string[]): Strings {
  const { en, tr, trApproved } = localizedFile("ui.json", locale);
  const enStrings = (en.strings ?? {}) as Record<string, string>;
  const trStrings = (tr?.strings ?? {}) as Record<string, unknown>;
  const want = (k: string) => k.startsWith("common.") || prefixes.some((p) => k.startsWith(p));
  const out: Strings = {};
  for (const [k, v] of Object.entries(FALLBACK_STRINGS)) if (want(k)) out[k] = v;
  for (const [k, v] of Object.entries(enStrings)) {
    if (want(k)) out[k] = pickLocalized(v, trStrings[k], trApproved);
  }
  return out;
}

// ---------- Practices ----------

export type BreathPhaseKind = "inhale" | "exhale" | "hold" | "hum";

export interface BreathPhase {
  phase: BreathPhaseKind;
  seconds: number;
  labelKey: string;
  side?: "left" | "right";
}

export interface Technique {
  /** Content id, e.g. `breath.sama-vritti`. */
  id: string;
  /** URL slug, e.g. `sama-vritti`. */
  slug: string;
  pattern: BreathPhase[];
  defaultMinutes: number;
  name: string;
  subtitle: string;
  what: string;
  steps: string[];
  skipIf: string[];
}

export interface Meditation {
  id: string;
  slug: string;
  title: string;
  guidance: string[];
  cues: { at: number; text: string }[];
  closing: string;
  note: string;
}

const slugOf = (id: string) => id.replace(/^[a-z]+\./, "");

function practicesData(): Json {
  return readJson("data/practices.json") ?? { techniques: [], meditations: [] };
}

export function loadTechniques(locale: Locale): Technique[] {
  const data = practicesData();
  const { en, tr, trApproved } = localizedFile("practices.json", locale);
  const enT = (en.techniques ?? {}) as Record<string, Json>;
  const trT = (tr?.techniques ?? {}) as Record<string, Json>;
  const list = (data.techniques ?? []) as Json[];
  return list
    .filter((t) => t.retention === false) // FR-4.1: never ship breath retention
    .map((t) => {
      const id = String(t.id);
      const e = enT[id] ?? {};
      const l = trT[id];
      const useTr = !!l && (approved(l) || trApproved);
      const text = (useTr ? { ...e, ...l } : e) as Json;
      return {
        id,
        slug: slugOf(id),
        pattern: (t.pattern as BreathPhase[]).map((p) => ({
          phase: p.phase,
          seconds: Number(p.seconds),
          labelKey: String(p.labelKey),
          ...(p.side ? { side: p.side } : {}),
        })),
        defaultMinutes: Number(t.defaultMinutes ?? 3),
        name: String(text.name ?? id),
        subtitle: String(text.subtitle ?? ""),
        what: String(text.what ?? ""),
        steps: (text.steps as string[]) ?? [],
        skipIf: (text.skipIf as string[]) ?? [],
      };
    });
}

export function loadMeditations(locale: Locale): Meditation[] {
  const data = practicesData();
  const { en, tr, trApproved } = localizedFile("practices.json", locale);
  const enM = (en.meditations ?? {}) as Record<string, Json>;
  const trM = (tr?.meditations ?? {}) as Record<string, Json>;
  return ((data.meditations ?? []) as Json[]).map((m) => {
    const id = String(m.id);
    const e = enM[id] ?? {};
    const l = trM[id];
    const text = (l && (approved(l) || trApproved) ? { ...e, ...l } : e) as Json;
    const cueTexts = (text.cues as string[]) ?? [];
    return {
      id,
      slug: slugOf(id),
      title: String(text.title ?? id),
      guidance: (text.guidance as string[]) ?? [],
      cues: ((m.cues as { at: number }[]) ?? []).map((c, i) => ({ at: c.at, text: cueTexts[i] ?? "" })).filter((c) => c.text),
      closing: String(text.closing ?? ""),
      note: String(text.note ?? ""),
    };
  });
}

// ---------- Journal ----------

export interface JournalContent {
  /** Ordered prompts (prompt.01 … prompt.30). */
  prompts: { id: string; text: string }[];
  /** Content mood key → label, e.g. `mood.peaceful` → "Peaceful". */
  moods: Record<string, { label: string; a11y: string }>;
}

export function loadJournalContent(locale: Locale): JournalContent {
  const { en, tr, trApproved } = localizedFile("journal.json", locale);
  const enP = (en.prompts ?? {}) as Record<string, string>;
  const trP = (tr?.prompts ?? {}) as Record<string, unknown>;
  const prompts = Object.keys(enP)
    .sort()
    .map((id) => ({ id, text: pickLocalized(enP[id]!, trP[id], trApproved) }));
  const enMoods = (en.moods ?? {}) as Record<string, { label: string; a11y: string }>;
  const trMoods = (tr?.moods ?? {}) as Record<string, unknown>;
  const moods: JournalContent["moods"] = {};
  for (const [k, v] of Object.entries(enMoods)) {
    const l = trMoods[k];
    moods[k] = l && (approved(l) || trApproved) ? { ...v, ...(l as object) } : v;
  }
  return { prompts, moods };
}

/**
 * Build-time loader for `content/en/yoga.json` (poses, sessions, programmes)
 * with HI/MR names from `content/{hi,mr}/yoga.json`. Board decision D-030:
 * for yoga, HI/MR draft text is SHOWN even when `reviewed` is false.
 * Server Components and tests only (uses `node:fs`).
 */
import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/i18n/config";
import { loadStrings } from "@/features/shared/content.server";
import { moduleSeconds } from "./logic";
import type { ModuleListItem, PoseListItem, ProgramListItem, YogaFile, YogaModule, YogaPose, YogaProgram } from "./types";

const DIR = path.join(process.cwd(), "content");

function read<T>(rel: string): T | null {
  const file = path.join(DIR, rel);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")) as T;
}

interface TrPose {
  name?: string;
  summary?: string;
  breathTip?: string;
  steps?: string[];
  benefits?: string[];
  cautions?: string[];
  reviewed?: boolean;
}
interface TrModule {
  title?: string;
  description?: string;
  steps?: { title?: string; instruction?: string; breath?: string }[];
  reviewed?: boolean;
}
interface TrProgram {
  title?: string;
  description?: string;
  days?: { name?: string }[];
  reviewed?: boolean;
}
interface Tr {
  poses?: Record<string, TrPose>;
  modules?: Record<string, TrModule>;
  programs?: Record<string, TrProgram>;
}

const str = (x: unknown): string | undefined => (typeof x === "string" && x.trim() ? x : undefined);
const list = (x: unknown, n: number): string[] | undefined =>
  Array.isArray(x) && x.length === n && x.every((v) => !!str(v)) ? (x as string[]) : undefined;

/** The pose with its translated text laid over the English (D-030: drafts are shown). */
function localizePose(p: YogaPose, t: TrPose | undefined): YogaPose {
  if (!t) return p;
  return {
    ...p,
    summary: str(t.summary) ?? p.summary,
    breathTip: str(t.breathTip) ?? p.breathTip,
    steps: list(t.steps, p.steps.length) ?? p.steps,
    benefits: list(t.benefits, p.benefits.length) ?? p.benefits,
    cautions: list(t.cautions, p.cautions.length) ?? p.cautions,
  };
}

function localizeModule(m: YogaModule, t: TrModule | undefined): YogaModule {
  if (!t) return m;
  return {
    ...m,
    description: str(t.description) ?? m.description,
    steps: m.steps.map((st, i) => {
      const x = t.steps?.[i];
      return { ...st, title: str(x?.title) ?? st.title, instruction: str(x?.instruction) ?? st.instruction, breath: str(x?.breath) ?? st.breath };
    }),
  };
}

let cache: YogaFile | null = null;
export function loadYogaFile(): YogaFile {
  cache ??= read<YogaFile>("en/yoga.json") ?? { poses: [], modules: [], programs: [] };
  return cache;
}

function pick(locale: Locale, text: string | undefined, _reviewed: boolean | undefined, en: string): { text: string; lang: Locale } {
  return locale !== "en" && !!text ? { text, lang: locale } : { text: en, lang: "en" };
}

function translations(locale: Locale): Tr {
  return locale === "en" ? {} : (read<Tr>(`${locale}/yoga.json`) ?? {});
}

export const allPoseSlugs = () => loadYogaFile().poses.map((p) => p.slug);
export const allModuleSlugs = () => loadYogaFile().modules.map((m) => m.slug);
export const allProgramIds = () => loadYogaFile().programs.map((p) => p.id);

export function poseItem(p: YogaPose, tr: Tr, locale: Locale): PoseListItem {
  const n = pick(locale, tr.poses?.[p.slug]?.name, tr.poses?.[p.slug]?.reviewed, p.name);
  return { slug: p.slug, name: n.text, nameLang: n.lang, sanskrit: p.sanskrit, level: p.level, category: p.category, holdSeconds: p.holdSeconds, image: p.image.file };
}

export function loadPoseList(locale: Locale): PoseListItem[] {
  const tr = translations(locale);
  return loadYogaFile().poses.map((p) => poseItem(p, tr, locale));
}

export function loadPose(slug: string, locale: Locale): { pose: YogaPose; item: PoseListItem } | null {
  const pose = loadYogaFile().poses.find((p) => p.slug === slug);
  if (!pose) return null;
  const tr = translations(locale);
  return { pose: localizePose(pose, tr.poses?.[slug]), item: poseItem(pose, tr, locale) };
}

/** Picture for a session tile: the image of its first linked pose. */
function moduleImage(m: YogaModule): string | null {
  const slug = m.steps.find((x) => x.pose)?.pose;
  return loadYogaFile().poses.find((p) => p.slug === slug)?.image.file ?? null;
}

function moduleItem(m: YogaModule, tr: Tr, locale: Locale): ModuleListItem {
  const n = pick(locale, tr.modules?.[m.slug]?.title, tr.modules?.[m.slug]?.reviewed, m.title);
  return { slug: m.slug, title: n.text, titleLang: n.lang, level: m.level, timeOfDay: m.timeOfDay, focus: m.focus, seconds: moduleSeconds(m.steps), steps: m.steps.length, image: moduleImage(m) };
}

export function loadModuleList(locale: Locale): ModuleListItem[] {
  const tr = translations(locale);
  return loadYogaFile().modules.map((m) => moduleItem(m, tr, locale));
}

/** A session with the names and images of the poses it links to. */
export function loadSession(slug: string, locale: Locale) {
  const file = loadYogaFile();
  const mod = file.modules.find((m) => m.slug === slug);
  if (!mod) return null;
  const tr = translations(locale);
  const poses: Record<string, { name: string; nameLang: Locale; image: string; alt: string }> = {};
  for (const st of mod.steps) {
    const p = st.pose ? file.poses.find((x) => x.slug === st.pose) : undefined;
    if (p && st.pose) {
      const it = poseItem(p, tr, locale);
      poses[st.pose] = { name: it.name, nameLang: it.nameLang, image: p.image.file, alt: p.image.alt };
    }
  }
  return { module: localizeModule(mod, tr.modules?.[slug]), item: moduleItem(mod, tr, locale), poses };
}

function programItem(p: YogaProgram, tr: Tr, locale: Locale): ProgramListItem {
  const file = loadYogaFile();
  const n = pick(locale, tr.programs?.[p.id]?.title, tr.programs?.[p.id]?.reviewed, p.title);
  return {
    id: p.id,
    title: n.text,
    titleLang: n.lang,
    level: p.level,
    description: pick(locale, tr.programs?.[p.id]?.description, undefined, p.description).text,
    days: p.days.map((d, i) => {
      const m = file.modules.find((x) => x.slug === d.module)!;
      return { day: d.day, name: pick(locale, tr.programs?.[p.id]?.days?.[i]?.name, undefined, d.name).text, module: d.module, moduleTitle: moduleItem(m, tr, locale).title, seconds: moduleSeconds(m.steps) };
    }),
  };
}

export function loadProgramList(locale: Locale): ProgramListItem[] {
  const tr = translations(locale);
  return loadYogaFile().programs.map((p) => programItem(p, tr, locale));
}

/** UI strings for yoga screens: HI/MR drafts are shown (D-030), English only where a key has no draft. */
export function loadYogaStrings(locale: Locale): Record<string, string> {
  const base = loadStrings(locale, ["yoga.", "a11y."]);
  if (locale === "en") return base;
  const tr = (read<{ strings?: Record<string, { text?: string }> }>(`${locale}/ui.json`)?.strings ?? {});
  const localized = new Set((base["@localized"] ?? "").split("|").filter(Boolean));
  for (const [k, v] of Object.entries(tr)) {
    if (k.startsWith("yoga.") && v?.text) {
      base[k] = v.text;
      localized.add(k);
    }
  }
  base["@localized"] = [...localized].join("|");
  return base;
}

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

interface Tr {
  poses?: Record<string, { name?: string; reviewed?: boolean }>;
  modules?: Record<string, { title?: string; reviewed?: boolean }>;
  programs?: Record<string, { title?: string; reviewed?: boolean }>;
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
  return pose ? { pose, item: poseItem(pose, translations(locale), locale) } : null;
}

function moduleItem(m: YogaModule, tr: Tr, locale: Locale): ModuleListItem {
  const n = pick(locale, tr.modules?.[m.slug]?.title, tr.modules?.[m.slug]?.reviewed, m.title);
  return { slug: m.slug, title: n.text, titleLang: n.lang, level: m.level, timeOfDay: m.timeOfDay, focus: m.focus, seconds: moduleSeconds(m.steps), steps: m.steps.length };
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
  return { module: mod, item: moduleItem(mod, tr, locale), poses };
}

function programItem(p: YogaProgram, tr: Tr, locale: Locale): ProgramListItem {
  const file = loadYogaFile();
  const n = pick(locale, tr.programs?.[p.id]?.title, tr.programs?.[p.id]?.reviewed, p.title);
  return {
    id: p.id,
    title: n.text,
    titleLang: n.lang,
    level: p.level,
    description: p.description,
    days: p.days.map((d) => {
      const m = file.modules.find((x) => x.slug === d.module)!;
      return { day: d.day, name: d.name, module: d.module, moduleTitle: moduleItem(m, tr, locale).title, seconds: moduleSeconds(m.steps) };
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

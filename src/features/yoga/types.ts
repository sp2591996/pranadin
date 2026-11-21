/** Shapes of `content/en/yoga.json` and the trimmed views passed to the client. */
import type { Locale } from "@/i18n/config";

export const POSE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export type PoseLevel = (typeof POSE_LEVELS)[number];

export const POSE_CATEGORIES = ["Standing", "Balance", "Seated", "Kneeling", "Prone", "Supine", "Twist", "Inversion"] as const;
export type PoseCategory = (typeof POSE_CATEGORIES)[number];

export const MODULE_TIMES = ["Morning", "Evening", "Anytime"] as const;
export const MODULE_FOCUS = ["Energy", "Calm", "Flexibility", "Strength", "Sleep"] as const;

export interface YogaSource {
  name: string;
  url?: string;
}

export interface YogaPose {
  id: string;
  slug: string;
  name: string;
  sanskrit: string;
  transliteration: string;
  category: PoseCategory;
  level: PoseLevel;
  holdSeconds: number;
  image: { file: string; alt: string };
  summary: string;
  breathTip: string;
  steps: string[];
  benefits: string[];
  cautions: string[];
  sources: YogaSource[];
}

export interface ModuleStep {
  title: string;
  seconds: number;
  instruction: string;
  breath: string;
  pose?: string;
}

export interface YogaModule {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: PoseLevel;
  timeOfDay: (typeof MODULE_TIMES)[number];
  focus: (typeof MODULE_FOCUS)[number];
  steps: ModuleStep[];
}

export interface ProgramDay {
  day: number;
  name: string;
  module: string;
}

export interface YogaProgram {
  id: string;
  title: string;
  level: PoseLevel;
  description: string;
  days: ProgramDay[];
}

export interface YogaFile {
  poses: YogaPose[];
  modules: YogaModule[];
  programs: YogaProgram[];
}

/** Language a localised name is shown in ("en" on a hi/mr page means it fell back to English). */
export type NameLang = Locale;

export interface PoseListItem {
  slug: string;
  name: string;
  nameLang: NameLang;
  sanskrit: string;
  level: PoseLevel;
  category: PoseCategory;
  holdSeconds: number;
  image: string;
}

export interface ModuleListItem {
  slug: string;
  title: string;
  titleLang: NameLang;
  level: PoseLevel;
  timeOfDay: YogaModule["timeOfDay"];
  focus: YogaModule["focus"];
  seconds: number;
  steps: number;
}

export interface ProgramListItem {
  id: string;
  title: string;
  titleLang: NameLang;
  level: PoseLevel;
  description: string;
  days: { day: number; name: string; module: string; moduleTitle: string; seconds: number }[];
}

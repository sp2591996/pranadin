/**
 * Religious stories (D-038): one small JSON file per story in content/stories,
 * plus _ui.json for the page strings. Build time only (uses node:fs).
 */
import fs from "node:fs";
import path from "node:path";
import { pickText, storiesUiSchema, storySchema, STORY_REGIONS, STORY_TRADITIONS, type LocalizedText, type StoryFile } from "@/content/draft";
import { draftStrings } from "@/features/shared/draft-content.server";
import type { Locale } from "@/i18n/config";

export type Txt = { text: string; lang: Locale };
export interface StoryImage {
  src: string;
  w: number;
  h: number;
  caption: Txt;
  credit: string;
  source: string;
}
export interface StoryView {
  id: string;
  tradition: StoryFile["tradition"];
  region: StoryFile["region"];
  place?: string;
  festival?: string;
  figure: Txt;
  title: Txt;
  teaser: Txt;
  images: StoryImage[];
  scenes: { title: Txt; text: Txt; image?: number }[];
  lesson: Txt;
  source: Txt;
}

const DIR = () => path.join(process.cwd(), "content", "stories");
const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(path.join(DIR(), file), "utf8").replace(/^﻿/, ""));

let cache: { ui: Record<string, LocalizedText>; stories: StoryFile[] } | null = null;
function file() {
  if (cache) return cache;
  const stories = fs
    .readdirSync(DIR())
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => {
      const s = storySchema.parse(readJson(f));
      if (`${s.id}.json` !== f) throw new Error(`stories/${f}: id "${s.id}" must match the file name`);
      for (const sc of s.scenes) if (sc.image !== undefined && sc.image >= s.images.length) throw new Error(`stories/${f}: scene image out of range`);
      return s;
    })
    .sort((a, b) => a.order - b.order);
  return (cache = { ui: storiesUiSchema.parse(readJson("_ui.json")).ui, stories });
}

export const storyIds = () => file().stories.map((s) => s.id);
export const loadStoryStrings = (locale: Locale) => draftStrings(file().ui, locale);

export function loadStories(locale: Locale): StoryView[] {
  const t = (f: LocalizedText): Txt => pickText(f, locale);
  return file().stories.map((s) => ({
    id: s.id,
    tradition: s.tradition,
    region: s.region,
    place: s.place,
    festival: s.festival,
    figure: t(s.figure),
    title: t(s.title),
    teaser: t(s.teaser),
    images: s.images.map((i) => ({ ...i, caption: t(i.caption) })),
    scenes: s.scenes.map((sc) => ({ title: t(sc.title), text: t(sc.text), image: sc.image })),
    lesson: t(s.lesson),
    source: t(s.source),
  }));
}

/** Traditions in display order, each with its regions and stories. */
export function storyGroups(stories: StoryView[]) {
  return STORY_TRADITIONS.map((tr) => ({
    tradition: tr,
    regions: STORY_REGIONS.map((r) => ({ region: r, stories: stories.filter((s) => s.tradition === tr && s.region === r) })).filter((g) => g.stories.length),
  })).filter((g) => g.regions.length);
}

export const storyRoutes = {
  list: (l: Locale) => `/${l}/calendar/stories/`,
  detail: (l: Locale, id: string) => `/${l}/calendar/stories/${id}/`,
};

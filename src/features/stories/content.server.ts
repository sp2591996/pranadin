/**
 * Story collections (D-040): content/stories/_clubs.json lists the collections
 * (Ramayana, Mahabharata, Gurucharitra ...); each collection's chapters live in
 * content/stories/<collection>/<chapter>.json. _ui.json holds the page strings.
 * Build time only (uses node:fs).
 */
import fs from "node:fs";
import path from "node:path";
import {
  pickText,
  storiesUiSchema,
  storyClubsSchema,
  storySchema,
  STORY_TRADITIONS,
  type LocalizedText,
  type StoryClubsFile,
  type StoryFile,
} from "@/content/draft";
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
type Club = StoryClubsFile["clubs"][number];
export interface StoryView {
  id: string;
  club: string;
  /** 1-based chapter number in the collection. */
  n: number;
  part?: string;
  place?: string;
  festival?: string;
  figure: Txt;
  title: Txt;
  teaser: Txt;
  images: StoryImage[];
  scenes: { title: Txt; text: Txt; image?: number }[];
  verse?: { text: string; lang: string; cite: Txt; meaning: Txt };
  reflect?: Txt;
  lesson: Txt;
  source: Txt;
}
export interface ClubView {
  id: string;
  tradition: Club["tradition"];
  region: Club["region"];
  title: Txt;
  subtitle: Txt;
  intro: Txt;
  growing: boolean;
  cover: StoryImage;
  parts: { id: string; title: Txt }[];
  chapters: StoryView[];
}

const DIR = () => path.join(process.cwd(), "content", "stories");
const readJson = (file: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(DIR(), file), "utf8").replace(/^﻿/, ""));

let cache: {
  ui: Record<string, LocalizedText>;
  clubs: { club: Club; chapters: StoryFile[] }[];
} | null = null;
function file() {
  if (cache) return cache;
  const clubs = storyClubsSchema
    .parse(readJson("_clubs.json"))
    .clubs.sort((a, b) => a.order - b.order)
    .map((club) => {
      const dir = path.join(DIR(), club.id);
      if (!fs.existsSync(dir))
        throw new Error(`stories/${club.id}: folder missing`);
      const parts = new Set(club.parts.map((p) => p.id));
      const chapters = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => {
          const s = storySchema.parse(readJson(path.join(club.id, f)));
          const where = `stories/${club.id}/${f}`;
          if (`${s.id}.json` !== f)
            throw new Error(`${where}: id "${s.id}" must match the file name`);
          for (const sc of s.scenes)
            if (sc.image !== undefined && sc.image >= s.images.length)
              throw new Error(`${where}: scene image out of range`);
          if (parts.size ? !s.part || !parts.has(s.part) : s.part)
            throw new Error(
              `${where}: part "${s.part ?? ""}" is not a part of ${club.id}`,
            );
          return s;
        })
        .sort((a, b) => a.order - b.order);
      if (!chapters.length) throw new Error(`stories/${club.id}: no chapters`);
      if (club.cover && !chapters.some((s) => s.id === club.cover))
        throw new Error(
          `stories/${club.id}: cover chapter "${club.cover}" missing`,
        );
      return { club, chapters };
    });
  const ids = clubs.flatMap((c) =>
    c.chapters.map((s) => `${c.club.id}/${s.id}`),
  );
  if (new Set(ids).size !== ids.length)
    throw new Error("stories: duplicate chapter id");
  return (cache = {
    ui: storiesUiSchema.parse(readJson("_ui.json")).ui,
    clubs,
  });
}

export const clubIds = () => file().clubs.map((c) => c.club.id);
export const chapterParams = () =>
  file().clubs.flatMap((c) =>
    c.chapters.map((s) => ({ club: c.club.id, chapter: s.id })),
  );
export const loadStoryStrings = (locale: Locale) =>
  draftStrings(file().ui, locale);

export function loadClubs(locale: Locale): ClubView[] {
  const t = (f: LocalizedText): Txt => pickText(f, locale);
  return file().clubs.map(({ club, chapters }) => {
    const cov = (chapters.find((s) => s.id === club.cover) ?? chapters[0]!)
      .images[0]!;
    return {
      id: club.id,
      tradition: club.tradition,
      region: club.region,
      title: t(club.title),
      subtitle: t(club.subtitle),
      intro: t(club.intro),
      growing: club.growing,
      cover: { ...cov, caption: t(cov.caption) },
      parts: club.parts.map((p) => ({ id: p.id, title: t(p.title) })),
      chapters: chapters.map((s, i) => ({
        id: s.id,
        club: club.id,
        n: i + 1,
        part: s.part,
        place: s.place,
        festival: s.festival,
        figure: t(s.figure),
        title: t(s.title),
        teaser: t(s.teaser),
        images: s.images.map((im) => ({ ...im, caption: t(im.caption) })),
        scenes: s.scenes.map((sc) => ({
          title: t(sc.title),
          text: t(sc.text),
          image: sc.image,
        })),
        verse: s.verse
          ? {
              text: s.verse.text,
              lang: s.verse.lang,
              cite: t(s.verse.cite),
              meaning: t(s.verse.meaning),
            }
          : undefined,
        reflect: s.reflect ? t(s.reflect) : undefined,
        lesson: t(s.lesson),
        source: t(s.source),
      })),
    };
  });
}

/** Traditions in display order, each with its collections. */
export function clubGroups(clubs: ClubView[]) {
  return STORY_TRADITIONS.map((tr) => ({
    tradition: tr,
    clubs: clubs.filter((c) => c.tradition === tr),
  })).filter((g) => g.clubs.length);
}

export const storyRoutes = {
  list: (l: Locale) => `/${l}/stories/`,
  club: (l: Locale, club: string) => `/${l}/stories/${club}/`,
  chapter: (l: Locale, club: string, id: string) =>
    `/${l}/stories/${club}/${id}/`,
};

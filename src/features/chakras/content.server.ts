import { chakrasSchema, pickText, type ChakrasFile, type DraftText } from "@/content/draft";
import { draftStrings, readDraftFile } from "@/features/shared/draft-content.server";
import type { Locale } from "@/i18n/config";
import type { ChakraView, Txt } from "./types";

let cache: ChakrasFile | null = null;
export const loadChakrasFile = (): ChakrasFile => (cache ??= readDraftFile("chakras.json", chakrasSchema));

export const chakraIds = () => loadChakrasFile().chakras.map((c) => c.id);
export const loadChakraStrings = (locale: Locale) => draftStrings(loadChakrasFile().ui, locale);

export function loadChakras(locale: Locale): ChakraView[] {
  const t = (f: DraftText): Txt => pickText(f, locale);
  return loadChakrasFile().chakras.map((c) => ({
    id: c.id,
    n: c.n,
    sa: c.sa,
    iast: c.iast,
    petals: c.petals,
    bija: c.bija,
    hex: c.hex,
    nick: t(c.nick),
    meaning: t(c.meaning),
    location: t(c.location),
    element: t(c.element),
    colour: t(c.colour),
    about: t(c.about),
    practice: t(c.practice),
    affirmation: t(c.affirmation),
    sources: c.sources,
  }));
}

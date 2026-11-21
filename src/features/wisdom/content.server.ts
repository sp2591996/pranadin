import { pickText, wisdomSchema, type WisdomFile } from "@/content/draft";
import { draftStrings, readDraftFile } from "@/features/shared/draft-content.server";
import type { Locale } from "@/i18n/config";
import type { VerseView } from "./types";

let cache: WisdomFile | null = null;
export const loadWisdomFile = (): WisdomFile => (cache ??= readDraftFile("wisdom.json", wisdomSchema));

export const loadWisdomStrings = (locale: Locale) => draftStrings(loadWisdomFile().ui, locale);

export function loadVerses(locale: Locale): VerseView[] {
  return loadWisdomFile().verses.map((v) => ({
    id: v.id,
    tradition: v.tradition,
    work: v.work,
    reference: v.reference,
    by: v.by,
    script: v.script,
    transliteration: v.transliteration,
    meaning: pickText(v.meaning, locale),
    note: v.note ? pickText(v.note, locale) : undefined,
    sources: v.sources,
  }));
}

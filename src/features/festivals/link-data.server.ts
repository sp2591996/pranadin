import type { Locale } from "@/i18n/config";
import { festivalByObservance, loadFestivalStrings } from "./content.server";
import type { FestivalLinkData } from "./FestivalLinks";

export function festivalLinkData(locale: Locale): FestivalLinkData {
  const s = loadFestivalStrings(locale);
  return {
    byObservance: festivalByObservance(),
    readLabel: s["festivals.readStory"]!,
    guideTitle: s["festivals.entry.title"]!,
    guideBody: s["festivals.entry.body"]!,
  };
}

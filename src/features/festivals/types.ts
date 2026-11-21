import type { Locale } from "@/i18n/config";

export interface Txt {
  text: string;
  lang: Locale;
}

export type FestivalTradition = "hindu" | "sikh" | "jain" | "buddhist" | "christian" | "islamic" | "parsi";

export interface FestivalView {
  id: string;
  traditions: FestivalTradition[];
  months: number[];
  name: Txt;
  tagline: Txt;
  story: Txt;
  storySource: Txt;
  why: Txt;
  steps: Txt[];
  regional: Txt;
  foods: Txt;
  note: Txt;
  sources: { label: string; url: string }[];
  /** Dates of the linked observances that the app shows (hidden `hold` items are not here). */
  dates: string[];
}

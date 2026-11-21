import type { Locale } from "@/i18n/config";

export interface Txt {
  text: string;
  lang: Locale;
}

export interface VerseView {
  id: string;
  tradition: string;
  work: string;
  reference: string;
  by?: string;
  script: { lang: string; text: string };
  transliteration?: string;
  meaning: Txt;
  note?: Txt;
  sources: { label: string; url: string }[];
}

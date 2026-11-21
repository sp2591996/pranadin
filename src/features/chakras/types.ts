import type { Locale } from "@/i18n/config";

export interface Txt {
  text: string;
  lang: Locale;
}

export interface ChakraView {
  id: string;
  n: number;
  sa: string;
  iast: string;
  petals: number;
  bija: { sa: string; iast: string } | null;
  hex: string;
  nick: Txt;
  meaning: Txt;
  location: Txt;
  element: Txt;
  colour: Txt;
  about: Txt;
  practice: Txt;
  affirmation: Txt;
  sources: { label: string; url: string }[];
}

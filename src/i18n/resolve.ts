/**
 * Per-item English fallback (D-008, ADR-007). Pure functions, safe on the
 * client and the build. No zod here, so nothing heavy reaches the browser.
 *
 * Content's format (`pranadin-content/1.0`):
 *   content/en/ui.json  { strings: { key: "English" } }
 *   content/hi/ui.json  { strings: { key: { text, reviewed, reviewer, reviewedOn } } }
 * Board D-030: a HI/MR string is shown whenever it has text, whatever its
 * `reviewed` flag says (the flag stays as data for the Board's later review).
 * Only a missing or blank string falls back to English.
 */
import type { Locale } from "./config";
import type { MessageKey, Messages } from "./keys";

export interface UiEnFile {
  strings: Record<string, string>;
}
export interface TranslatedString {
  text: string;
  reviewed: boolean;
}
export interface UiTranslationFile {
  strings: Record<string, TranslatedString>;
}

export type MessageSource = "translated" | "en";

export interface ResolvedMessages {
  messages: Messages;
  /** Where each string came from; the content report and the "Showing English" note use it. */
  source: Record<MessageKey, MessageSource>;
}

export function isReviewed(t: TranslatedString | undefined): t is TranslatedString {
  return !!t && typeof t.text === "string" && t.text.trim() !== "";
}

/** Resolve UI strings for a locale from Content's English file and, for hi/mr, its translation file. */
export function resolveMessages(
  locale: Locale,
  en: UiEnFile,
  translation?: UiTranslationFile | null,
): ResolvedMessages {
  const messages = {} as Messages;
  const source = {} as Record<MessageKey, MessageSource>;
  for (const key of Object.keys(en.strings) as MessageKey[]) {
    const tr = locale === "en" ? undefined : translation?.strings[key];
    if (isReviewed(tr)) {
      messages[key] = tr.text;
      source[key] = "translated";
    } else {
      messages[key] = en.strings[key]!;
      source[key] = "en";
    }
  }
  return { messages, source };
}

/**
 * Localize one content item (e.g. an observance's `{ name, note }`).
 * D-030: the translated item is used whether or not it is reviewed; blank or
 * missing fields fall back to English. `fellBack` lets the UI say "Showing English" instead of
 * mixing languages silently.
 */
export function localizeItem<F extends Record<string, unknown>>(
  en: F,
  translated: (Partial<F> & { reviewed?: boolean }) | undefined,
  locale: Locale,
  fileReviewed = false,
): F & { lang: Locale; fellBack: boolean } {
  if (locale === "en") return { ...en, lang: "en", fellBack: false };
  const ok = !!translated;
  void fileReviewed;
  if (!ok) return { ...en, lang: "en", fellBack: true };
  const merged: Record<string, unknown> = { ...en };
  let partial = false;
  for (const k of Object.keys(en)) {
    const v = (translated as Record<string, unknown>)[k];
    if (v === undefined || (typeof v === "string" && v.trim() === "")) partial = true;
    else merged[k] = v;
  }
  return { ...(merged as F), lang: locale, fellBack: partial };
}

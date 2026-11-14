/**
 * Per-item English fallback (D-008, ADR-007). Pure functions, safe on the
 * client and the build. No zod here, so nothing heavy reaches the browser.
 */
import { catalog, MESSAGE_KEYS, type MessageKey, type Messages } from "./catalog";
import type { Locale } from "./config";

export interface ReviewLike {
  status: "pending" | "changes_requested" | "approved";
}

export interface UiEnFile {
  strings: Record<string, string>;
}
export interface UiTranslationFile {
  strings: Record<string, { text: string; review: ReviewLike }>;
}

export type MessageSource = "approved" | "content-en" | "placeholder";

export interface ResolvedMessages {
  messages: Messages;
  /** Where each string came from; used by the content report and the "Available in English" note. */
  source: Record<MessageKey, MessageSource>;
}

/**
 * Resolve UI strings for a locale. Order per key:
 *   1. reviewed HI/MR text (review.status === "approved"), for hi/mr only
 *   2. Content's English (`app/content/ui/en.json`)
 *   3. the developer placeholder in `catalog.ts`
 * Unknown keys in content files are ignored (the content test flags them).
 */
export function resolveMessages(
  locale: Locale,
  contentEn?: UiEnFile | null,
  translation?: UiTranslationFile | null,
): ResolvedMessages {
  const messages = {} as Messages;
  const source = {} as Record<MessageKey, MessageSource>;
  for (const key of MESSAGE_KEYS) {
    const tr = locale !== "en" ? translation?.strings[key] : undefined;
    const en = contentEn?.strings[key];
    if (tr && tr.review.status === "approved" && tr.text.trim() !== "") {
      messages[key] = tr.text;
      source[key] = "approved";
    } else if (en !== undefined && en.trim() !== "") {
      messages[key] = en;
      source[key] = "content-en";
    } else {
      messages[key] = catalog[key].en;
      source[key] = "placeholder";
    }
  }
  return { messages, source };
}

export interface LocalizedBlock {
  review?: ReviewLike;
}

export interface ItemWithI18n<F> {
  i18n: { en: F; hi?: Partial<F> & LocalizedBlock; mr?: Partial<F> & LocalizedBlock };
}

/**
 * Localize one content item. If the locale block is approved, its fields are
 * used, and any field it lacks falls back to English. If not approved (or
 * absent), the whole item is English and `fellBack` is true, so the UI can
 * show "Available in English" instead of mixing languages silently.
 */
export function localizeItem<F extends object>(
  item: ItemWithI18n<F>,
  locale: Locale,
): F & { lang: Locale; fellBack: boolean } {
  const en = item.i18n.en;
  if (locale === "en") return { ...en, lang: "en", fellBack: false };
  const block = item.i18n[locale];
  if (!block || block.review?.status !== "approved") {
    return { ...en, lang: "en", fellBack: true };
  }
  const merged = { ...en } as F;
  let partial = false;
  for (const k of Object.keys(en) as (keyof F)[]) {
    const v = block[k];
    if (v === undefined || (typeof v === "string" && v.trim() === "")) {
      partial = true;
    } else {
      merged[k] = v as F[keyof F];
    }
  }
  return { ...merged, lang: locale, fellBack: partial };
}

/** Keep only items that may ship. */
export function publishedOnly<T extends { status: string }>(items: readonly T[]): T[] {
  return items.filter((i) => i.status === "published");
}

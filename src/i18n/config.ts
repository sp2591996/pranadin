import { LOCALES, type Locale, type TimeZone } from "@/lib/types";

export { LOCALES };
export type { Locale };

export const DEFAULT_LOCALE: Locale = "en";
export const DEFAULT_TIME_ZONE: TimeZone = "Asia/Kolkata";

/** BCP 47 tags passed to every `Intl` formatter (ML-6). */
export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

/** Each language's name in its own script, for the language switcher. */
export const LOCALE_NATIVE_NAME: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
};

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/**
 * Pick a locale from a stored preference, then the browser's language list,
 * then English. Pure, so the root redirect can be unit-tested.
 */
export function negotiateLocale(
  stored: string | null | undefined,
  browserLanguages: readonly string[] = [],
): Locale {
  if (isLocale(stored)) return stored;
  for (const tag of browserLanguages) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

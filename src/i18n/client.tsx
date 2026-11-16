"use client";

/**
 * Client-side i18n. The locale layout resolves messages at build time and
 * passes them here, so each page ships only its own language.
 *
 *   const { t, locale } = useI18n();
 *   t("panchang.until", { time: "6:52 am" })
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { MessageKey, Messages } from "./catalog";
import type { Locale } from "./config";
import { interpolate, pluralCategory } from "./format";

interface I18nValue {
  locale: Locale;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  /** Plural helper: looks up `${base}.${category}`, falling back to `${base}.other`. */
  tp: (base: string, count: number, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  const value = useMemo<I18nValue>(() => {
    const t: I18nValue["t"] = (key, params) => interpolate(messages[key], params);
    const tp: I18nValue["tp"] = (base, count, params) => {
      const all = messages as Record<string, string>;
      const tpl = all[`${base}.${pluralCategory(locale, count)}`] ?? all[`${base}.other`] ?? base;
      return interpolate(tpl, { count, ...params });
    };
    return { locale, t, tp };
  }, [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(I18nContext);
  if (!v) throw new Error("useI18n must be used inside <I18nProvider>");
  return v;
}

"use client";

/**
 * Client-side i18n. The locale layout resolves messages at build time and
 * passes them here, so each page ships only its own language.
 *
 *   const { t, locale } = useI18n();
 *   t("today.panchang.until", { time: "6:52 am" })
 *   t("today.week.days", { count: 3 })      // ICU plural
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import { formatMessage, type Params } from "./format";
import type { MessageKey, Messages } from "./keys";

interface I18nValue {
  locale: Locale;
  t: (key: MessageKey, params?: Params) => string;
  /** How many UI strings on this locale are showing English (no reviewed translation yet). */
  fallbackCount: number;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  fallbackCount,
  children,
}: {
  locale: Locale;
  messages: Messages;
  fallbackCount: number;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(() => {
    return {
      locale,
      t: (key, params) => formatMessage(messages[key] ?? key, params, locale),
      fallbackCount,
    };
  }, [locale, messages, fallbackCount]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(I18nContext);
  if (!v) throw new Error("useI18n must be used inside <I18nProvider>");
  return v;
}

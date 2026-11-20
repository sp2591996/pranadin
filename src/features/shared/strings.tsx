"use client";

/**
 * Feature strings for Dev-2 screens. The page (Server Component) loads
 * Content's strings with `loadStrings()` and passes them here.
 *
 *   const s = useS();
 *   s("streak.count", { count: 3 })
 */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { DisplaySync } from "@/features/settings/DisplaySync";
import { FALLBACK_STRINGS } from "./fallback-strings";
import { formatMessage, type Params } from "./format-message";

const Ctx = createContext<Record<string, string>>({});

export function StringsProvider({ strings, children }: { strings: Record<string, string>; children: ReactNode }) {
  return (
    <Ctx.Provider value={strings}>
      {/* Applies text size and reduce-motion on every Dev-2 screen (and Today via the plan slot). */}
      <DisplaySync />
      {children}
    </Ctx.Provider>
  );
}

export type S = (key: string, params?: Params) => string;

export function useS(): S {
  const strings = useContext(Ctx);
  const { locale } = useI18n();
  // Keys shown in the user's language; the rest fell back to English and use English plural rules.
  const localized = useMemo(() => new Set((strings["@localized"] ?? "").split("|").filter(Boolean)), [strings]);
  return useCallback(
    (key: string, params?: Params) =>
      formatMessage(strings[key] ?? FALLBACK_STRINGS[key] ?? key, params, localized.has(key) ? locale : "en"),
    [strings, locale, localized],
  );
}

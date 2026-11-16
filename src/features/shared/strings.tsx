"use client";

/**
 * Feature strings for Dev-2 screens. The page (Server Component) loads
 * Content's strings with `loadStrings()` and passes them here.
 *
 *   const s = useS();
 *   s("streak.count", { count: 3 })
 */
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { FALLBACK_STRINGS } from "./fallback-strings";
import { formatMessage, type Params } from "./format-message";

const Ctx = createContext<Record<string, string>>({});

export function StringsProvider({ strings, children }: { strings: Record<string, string>; children: ReactNode }) {
  return <Ctx.Provider value={strings}>{children}</Ctx.Provider>;
}

export type S = (key: string, params?: Params) => string;

export function useS(): S {
  const strings = useContext(Ctx);
  const { locale } = useI18n();
  return useCallback(
    (key: string, params?: Params) => formatMessage(strings[key] ?? FALLBACK_STRINGS[key] ?? key, params, locale),
    [strings, locale],
  );
}

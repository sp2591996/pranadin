/**
 * Thin wrapper over the shared ICU-subset formatter in `src/i18n/format.ts`
 * (Dev-1, per CONTRACTS.md), with defaults for Dev-2 call sites.
 */
import type { Locale } from "@/i18n/config";
import { formatMessage as sharedFormat } from "@/i18n/format";

export type Params = Record<string, string | number>;

export function formatMessage(template: string, params: Params = {}, locale: Locale = "en"): string {
  return sharedFormat(template, params, locale);
}

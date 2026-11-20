/**
 * Formatting helpers. All dates and times go through `Intl` with the user's
 * locale and city time zone (default Asia/Kolkata). Never use UTC day
 * boundaries (prototype defect P3).
 */
import type { LocalDateKey, TimeZone } from "@/lib/types";
import { DEFAULT_TIME_ZONE, INTL_LOCALE, type Locale } from "./config";

export type Params = Record<string, string | number>;

/** Plural category for a count (`one`, `other`, ...) in a locale. */
export function pluralCategory(locale: Locale, count: number): Intl.LDMLPluralRule {
  return new Intl.PluralRules(INTL_LOCALE[locale]).select(count);
}

/** Index of the `}` matching the `{` at `open`, or -1. */
function matchBrace(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

/** Parse ICU options: `one {# day} other {# days} =0 {none}`. */
function parseOptions(s: string): Map<string, string> {
  const out = new Map<string, string>();
  let i = 0;
  while (i < s.length) {
    const m = /^\s*(=?\w+)\s*\{/.exec(s.slice(i));
    if (!m) break;
    const open = i + m[0].length - 1;
    const close = matchBrace(s, open);
    if (close < 0) break;
    out.set(m[1]!, s.slice(open + 1, close));
    i = close + 1;
  }
  return out;
}

/**
 * Format a message: `{name}` placeholders plus the ICU subset Content uses,
 * `{n, plural, one {...} other {...}}` (with `#` and `=N`) and
 * `{x, select, a {...} other {...}}`. Unknown placeholders stay visible so a
 * missing param is caught in review. No sentence concatenation (ML-7).
 */
export function formatMessage(template: string, params: Params | undefined, locale: Locale): string {
  let out = "";
  let i = 0;
  while (i < template.length) {
    const open = template.indexOf("{", i);
    if (open < 0) {
      out += template.slice(i);
      break;
    }
    out += template.slice(i, open);
    const close = matchBrace(template, open);
    if (close < 0) {
      out += template.slice(open);
      break;
    }
    const inner = template.slice(open + 1, close);
    const icu = /^\s*(\w+)\s*,\s*(plural|select)\s*,([\s\S]*)$/.exec(inner);
    if (icu) {
      const [, name, kind, rest] = icu as unknown as [string, string, string, string];
      const value = params?.[name];
      const opts = parseOptions(rest);
      let chosen: string | undefined;
      if (kind === "plural" && typeof value === "number") {
        chosen = opts.get(`=${value}`) ?? opts.get(pluralCategory(locale, value)) ?? opts.get("other");
        chosen = chosen?.replace(/#/g, formatNumber(value, locale));
      } else if (value !== undefined) {
        chosen = opts.get(String(value)) ?? opts.get("other");
      }
      out += chosen !== undefined ? formatMessage(chosen, params, locale) : template.slice(open, close + 1);
    } else if (/^\w+$/.test(inner) && params && Object.prototype.hasOwnProperty.call(params, inner)) {
      out += String(params[inner]);
    } else {
      out += template.slice(open, close + 1);
    }
    i = close + 1;
  }
  return out;
}

/** `{name}` substitution only (kept for non-ICU callers). */
export function interpolate(template: string, params?: Params): string {
  return formatMessage(template, params, "en");
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();
function dtf(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(opts);
  let f = dtfCache.get(key);
  if (!f) {
    // Latin digits in every language (CONTRACTS: mr-IN otherwise defaults to Devanagari digits,
    // which also made visible text and accessible names disagree, QA a11y).
    f = new Intl.DateTimeFormat(locale, { numberingSystem: "latn", ...opts });
    dtfCache.set(key, f);
  }
  return f;
}

/** Calendar day (`YYYY-MM-DD`) of an instant in a time zone. */
export function localDateKey(instant: Date | number, timeZone: TimeZone = DEFAULT_TIME_ZONE): LocalDateKey {
  const parts = dtf("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Parse `YYYY-MM-DD` into numbers. Throws on malformed input. */
export function parseDateKey(key: LocalDateKey): { y: number; m: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) throw new Error(`Invalid date key: ${key}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

/** Add whole calendar days to a date key (time-zone independent). */
export function addDays(key: LocalDateKey, days: number): LocalDateKey {
  const { y, m, d } = parseDateKey(key);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/** Day of week for a date key, 0 = Sunday. */
export function weekday(key: LocalDateKey): number {
  const { y, m, d } = parseDateKey(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Format a calendar day for display. Uses noon UTC of that day with
 * `timeZone: "UTC"`, so the printed day never shifts.
 */
export function formatDateKey(
  key: LocalDateKey,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" },
): string {
  const { y, m, d } = parseDateKey(key);
  return dtf(INTL_LOCALE[locale], { ...opts, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

/** Format an instant as a local clock time, e.g. "6:52 am". */
export function formatTime(
  instant: Date | number | null,
  locale: Locale,
  timeZone: TimeZone = DEFAULT_TIME_ZONE,
): string {
  if (instant === null) return "—";
  return dtf(INTL_LOCALE[locale], { hour: "numeric", minute: "2-digit", timeZone }).format(instant);
}

/** Format a number with Western digits by default (ML-6). */
export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], { numberingSystem: "latn" }).format(n);
}

/** Local hour (0-23) of an instant in a time zone; used for the greeting. */
export function localHour(instant: Date | number, timeZone: TimeZone = DEFAULT_TIME_ZONE): number {
  const h = dtf("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone }).format(instant);
  return Number(h);
}

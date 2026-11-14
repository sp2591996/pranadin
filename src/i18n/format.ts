/**
 * Formatting helpers. All dates and times go through `Intl` with the user's
 * locale and city time zone (default Asia/Kolkata). Never use UTC day
 * boundaries (prototype defect P3).
 */
import type { LocalDateKey, TimeZone } from "@/lib/types";
import { DEFAULT_TIME_ZONE, INTL_LOCALE, type Locale } from "./config";

type Params = Record<string, string | number>;

/**
 * Replace `{name}` placeholders. Unknown placeholders are left visible so a
 * missing param is caught in review rather than silently dropped. No string
 * concatenation for sentences (ML-7): put the whole sentence in the catalog.
 */
export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole,
  );
}

/**
 * Plural category for a count (`one`, `other`, ...). Catalog keys for plurals
 * use the suffix convention `key.one` / `key.other`.
 */
export function pluralCategory(locale: Locale, count: number): Intl.LDMLPluralRule {
  return new Intl.PluralRules(INTL_LOCALE[locale]).select(count);
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();
function dtf(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(opts);
  let f = dtfCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opts);
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

/**
 * Daily reminder as a calendar file (CR-01, FR-13, US-35, L5 6b). Built on
 * the device; nothing is sent; no notification permission.
 *
 * RFC 5545: CRLF line endings, lines folded at 75 octets, TEXT escaped.
 * The event uses the device's IANA time zone as TZID. For zones without
 * daylight saving (e.g. Asia/Kolkata) a VTIMEZONE block is included, so
 * strict importers are happy; for DST zones we rely on Google and Apple
 * Calendar resolving the IANA name, which both do.
 */
export interface IcsInput {
  /** `HH:MM`, 24-hour local time. */
  time: string;
  timeZone: string;
  title: string;
  description: string;
  /** Link back to Today; must carry no personal ID. */
  url: string;
  /** Creation instant (DTSTAMP and the first day). */
  now: Date;
  uid: string;
}

export function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold a content line at 75 octets (UTF-8 safe: never splits a code point). */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + b > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const pad = (n: number) => String(n).padStart(2, "0");

function utcStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** Local `YYYYMMDD` of an instant in a time zone. */
function localDate(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}`;
}

/** UTC offset in minutes of a zone at an instant (e.g. +330 for Asia/Kolkata). */
export function offsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60_000);
}

function fmtOffset(min: number): string {
  const sign = min < 0 ? "-" : "+";
  const a = Math.abs(min);
  return `${sign}${pad(Math.floor(a / 60))}${pad(a % 60)}`;
}

export function buildDailyIcs(i: IcsInput): string {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(i.time)) throw new Error("time must be HH:MM");
  const [hh, mm] = i.time.split(":");
  const tz = i.timeZone;
  const year = i.now.getUTCFullYear();
  const jan = offsetMinutes(tz, new Date(Date.UTC(year, 0, 1)));
  const jul = offsetMinutes(tz, new Date(Date.UTC(year, 6, 1)));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PranaDin//Daily reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  if (jan === jul) {
    lines.push(
      "BEGIN:VTIMEZONE",
      `TZID:${tz}`,
      "BEGIN:STANDARD",
      "DTSTART:19700101T000000",
      `TZOFFSETFROM:${fmtOffset(jan)}`,
      `TZOFFSETTO:${fmtOffset(jan)}`,
      "END:STANDARD",
      "END:VTIMEZONE",
    );
  }
  lines.push(
    "BEGIN:VEVENT",
    `UID:${i.uid}`,
    `DTSTAMP:${utcStamp(i.now)}`,
    `DTSTART;TZID=${tz}:${localDate(i.now, tz)}T${hh}${mm}00`,
    "DURATION:PT10M",
    "RRULE:FREQ=DAILY",
    `SUMMARY:${escapeText(i.title)}`,
    `DESCRIPTION:${escapeText(i.description)}`,
    `URL:${i.url}`,
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(i.title)}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

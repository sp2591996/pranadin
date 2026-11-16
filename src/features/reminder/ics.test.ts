import { describe, expect, it } from "vitest";
import { buildDailyIcs, escapeText, foldLine, offsetMinutes } from "./ics";

const input = {
  time: "07:00",
  timeZone: "Asia/Kolkata",
  title: "PranaDin: today's practice",
  description: "A few minutes of breath and stillness. Open PranaDin: https://pranadin.vercel.app/mr/today/",
  url: "https://pranadin.vercel.app/mr/today/",
  now: new Date(Date.UTC(2026, 10, 17, 20, 0, 0)), // 18 Nov 01:30 IST
  uid: "abc@pranadin",
};

describe("daily reminder .ics (US-35, FR-13)", () => {
  const ics = buildDailyIcs(input);
  const unfolded = ics.replace(/\r\n /g, "");

  it("is a daily recurring event at local 07:00 with TZID", () => {
    expect(unfolded).toContain("RRULE:FREQ=DAILY");
    expect(unfolded).toContain("DTSTART;TZID=Asia/Kolkata:20261118T070000"); // local day, not UTC day
    expect(unfolded).toContain("BEGIN:VTIMEZONE\r\nTZID:Asia/Kolkata");
    expect(unfolded).toContain("TZOFFSETTO:+0530");
    expect(unfolded).toContain("DTSTAMP:20261117T200000Z");
  });

  it("uses CRLF, escapes text and folds long lines at 75 octets", () => {
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(unfolded).toContain("SUMMARY:PranaDin: today's practice");
    expect(escapeText("a,b;c\nd")).toBe(String.raw`a\,b\;c\nd`);
  });

  it("folds Devanagari without splitting characters", () => {
    const long = "SUMMARY:" + "प्राणदिन ".repeat(20);
    const folded = foldLine(long);
    expect(folded.replace(/\r\n /g, "")).toBe(long);
  });

  it("contains no personal identifiers, only the Today link", () => {
    expect(unfolded).toContain("URL:https://pranadin.vercel.app/mr/today/");
    expect(unfolded).not.toMatch(/install|\?id=/i);
  });

  it("omits VTIMEZONE for zones with daylight saving", () => {
    const ny = buildDailyIcs({ ...input, timeZone: "America/New_York" });
    expect(ny).not.toContain("BEGIN:VTIMEZONE");
    expect(ny).toContain("DTSTART;TZID=America/New_York:20261117T070000");
  });

  it("rejects a bad time and computes offsets", () => {
    expect(() => buildDailyIcs({ ...input, time: "7am" })).toThrow();
    expect(offsetMinutes("Asia/Kolkata", new Date())).toBe(330);
  });
});

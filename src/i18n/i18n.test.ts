import { describe, expect, it } from "vitest";
import { masaKey, nakshatraKey, tithiKey } from "./keys";
import { DEFAULT_TIME_ZONE, isLocale, negotiateLocale } from "./config";
import {
  addDays,
  formatDateKey,
  formatMessage,
  formatNumber,
  formatTime,
  interpolate,
  localDateKey,
  localHour,
  parseDateKey,
  pluralCategory,
  weekday,
} from "./format";
import { localizeItem, resolveMessages } from "./resolve";


describe("locale negotiation", () => {
  it("prefers a stored locale, then the browser, then English", () => {
    expect(negotiateLocale("mr", ["hi-IN"])).toBe("mr");
    expect(negotiateLocale(null, ["fr-FR", "hi-IN"])).toBe("hi");
    expect(negotiateLocale("xx", ["MR"])).toBe("mr");
    expect(negotiateLocale(undefined, ["de"])).toBe("en");
    expect(isLocale("hi")).toBe(true);
    expect(isLocale("hi-IN")).toBe(false);
  });
});

describe("resolveMessages: per-item English fallback", () => {
  const en = { strings: { "nav.today": "Today", "nav.journal": "Journal", "nav.practice": "Practice" } };
  it("uses reviewed HI text, and English for unreviewed or missing items", () => {
    const hi = {
      strings: {
        "nav.today": { text: "आज", reviewed: true },
        "nav.journal": { text: "डायरी", reviewed: false },
      },
    };
    const r = resolveMessages("hi", en, hi);
    expect(r.messages["nav.today"]).toBe("आज");
    expect(r.source["nav.today"]).toBe("reviewed");
    expect(r.messages["nav.journal"]).toBe("Journal");
    expect(r.source["nav.journal"]).toBe("en");
    expect(r.messages["nav.practice"]).toBe("Practice");
  });

  it("never uses a translation for English, and ignores blank reviewed text", () => {
    const hi = { strings: { "nav.today": { text: "  ", reviewed: true } } };
    expect(resolveMessages("hi", en, hi).messages["nav.today"]).toBe("Today");
    expect(resolveMessages("en", en, hi).messages["nav.today"]).toBe("Today");
    expect(resolveMessages("mr", en, null).messages["nav.today"]).toBe("Today");
  });
});

describe("localizeItem", () => {
  const en = { name: "Guru Nanak Gurpurab", note: "Birth anniversary of Guru Nanak Dev Ji." };
  it("returns English for en", () => {
    expect(localizeItem(en, undefined, "en")).toMatchObject({ name: en.name, lang: "en", fellBack: false });
  });
  it("merges a reviewed item field by field, flagging a partial fallback", () => {
    const r = localizeItem(en, { name: "गुरु नानक गुरपुरब", reviewed: true }, "hi");
    expect(r.name).toBe("गुरु नानक गुरपुरब");
    expect(r.note).toBe(en.note);
    expect(r.fellBack).toBe(true);
  });
  it("falls back to the whole English item when not reviewed", () => {
    expect(localizeItem(en, { name: "x", note: "y", reviewed: false }, "mr")).toMatchObject({ name: en.name, lang: "en", fellBack: true });
    expect(localizeItem(en, undefined, "mr").fellBack).toBe(true);
  });
  it("accepts a file-level review unless the item opts out", () => {
    expect(localizeItem(en, { name: "a", note: "b" }, "hi", true)).toMatchObject({ name: "a", lang: "hi", fellBack: false });
    expect(localizeItem(en, { name: "a", note: "b", reviewed: false }, "hi", true).lang).toBe("en");
  });
});

describe("glossary keys", () => {
  it("maps engine indices to Content's keys", () => {
    expect(tithiKey(0)).toBe("tithi.1");
    expect(tithiKey(14)).toBe("tithi.purnima");
    expect(tithiKey(15)).toBe("tithi.1");
    expect(tithiKey(28)).toBe("tithi.14");
    expect(tithiKey(29)).toBe("tithi.amavasya");
    expect(nakshatraKey(26)).toBe("nakshatra.27");
    expect(masaKey(0)).toBe("masa.1");
  });
});

describe("formatMessage (ICU subset)", () => {
  it("handles plurals with # and =N, per locale", () => {
    const tpl = "{count, plural, =0 {No days} one {# practice day} other {# practice days}}";
    expect(formatMessage(tpl, { count: 0 }, "en")).toBe("No days");
    expect(formatMessage(tpl, { count: 1 }, "en")).toBe("1 practice day");
    expect(formatMessage(tpl, { count: 3 }, "en")).toBe("3 practice days");
    expect(formatMessage("{n, plural, one {# min} other {# mins}}", { n: 1200 }, "en")).toBe("1,200 mins");
  });
  it("handles select and nested placeholders", () => {
    const tpl = "{kind, select, breath {Breathe for {m} min} other {Sit for {m} min}}";
    expect(formatMessage(tpl, { kind: "breath", m: 3 }, "en")).toBe("Breathe for 3 min");
    expect(formatMessage(tpl, { kind: "x", m: 5 }, "en")).toBe("Sit for 5 min");
  });
  it("leaves unknown or missing params visible", () => {
    expect(formatMessage("Hi {name}", undefined, "en")).toBe("Hi {name}");
    expect(formatMessage("{count, plural, one {#} other {#}}", {}, "en")).toBe("{count, plural, one {#} other {#}}");
  });
});

describe("format helpers", () => {
  it("interpolates named params and leaves unknown ones visible", () => {
    expect(interpolate("until {time}", { time: "6:52 am" })).toBe("until 6:52 am");
    expect(interpolate("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });

  it("picks plural categories per locale", () => {
    expect(pluralCategory("en", 1)).toBe("one");
    expect(pluralCategory("en", 2)).toBe("other");
    expect(pluralCategory("hi", 0)).toBe("one");
  });

  it("defaults to Asia/Kolkata for day boundaries (not UTC)", () => {
    expect(DEFAULT_TIME_ZONE).toBe("Asia/Kolkata");
    // 2026-11-14 20:00 UTC is 2026-11-15 01:30 IST.
    const t = Date.UTC(2026, 10, 14, 20, 0);
    expect(localDateKey(t)).toBe("2026-11-15");
    expect(localDateKey(t, "UTC")).toBe("2026-11-14");
    expect(localDateKey(t, "America/New_York")).toBe("2026-11-14");
    expect(localHour(t)).toBe(1);
  });

  it("does date-key arithmetic across month and year edges", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    expect(weekday("2026-11-20")).toBe(5); // Friday, launch day
    expect(() => parseDateKey("2026-1-5")).toThrow();
  });

  it("formats dates and times with Intl in each language", () => {
    // Exact punctuation depends on the ICU version, so check the parts.
    expect(formatDateKey("2026-11-20", "en")).toMatch(/^Friday,? 20 November$/);
    expect(formatDateKey("2026-11-20", "hi")).toContain("नवंबर");
    expect(formatDateKey("2026-11-20", "mr")).toContain("नोव्हेंबर");
    const t = Date.UTC(2026, 10, 20, 1, 22); // 06:52 IST
    expect(formatTime(t, "en")).toMatch(/^6:52\s?am$/i);
    expect(formatTime(null, "en")).toBe("—");
    expect(formatNumber(1234, "hi")).toBe("1,234");
  });
});

import { describe, expect, it } from "vitest";
import { catalog, MESSAGE_KEYS } from "./catalog";
import { DEFAULT_TIME_ZONE, isLocale, negotiateLocale } from "./config";
import {
  addDays,
  formatDateKey,
  formatNumber,
  formatTime,
  interpolate,
  localDateKey,
  localHour,
  parseDateKey,
  pluralCategory,
  weekday,
} from "./format";
import { localizeItem, publishedOnly, resolveMessages } from "./resolve";

const approved = { status: "approved" as const };
const pending = { status: "pending" as const };

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
  it("uses developer placeholders when no content exists", () => {
    const r = resolveMessages("hi");
    expect(r.messages["nav.today"]).toBe(catalog["nav.today"].en);
    expect(r.source["nav.today"]).toBe("placeholder");
    expect(Object.keys(r.messages)).toHaveLength(MESSAGE_KEYS.length);
  });

  it("uses approved HI text, and English for pending or missing items", () => {
    const en = { strings: { "nav.today": "Today", "nav.journal": "Journal" } };
    const hi = {
      strings: {
        "nav.today": { text: "आज", review: approved },
        "nav.journal": { text: "डायरी", review: pending },
      },
    };
    const r = resolveMessages("hi", en, hi);
    expect(r.messages["nav.today"]).toBe("आज");
    expect(r.source["nav.today"]).toBe("approved");
    expect(r.messages["nav.journal"]).toBe("Journal");
    expect(r.source["nav.journal"]).toBe("content-en");
    expect(r.source["nav.practice"]).toBe("placeholder");
  });

  it("never uses a translation for English, and ignores blank text", () => {
    const hi = { strings: { "nav.today": { text: "  ", review: approved } } };
    expect(resolveMessages("hi", null, hi).messages["nav.today"]).toBe("Today");
    expect(resolveMessages("en", null, hi).messages["nav.today"]).toBe("Today");
  });
});

describe("localizeItem", () => {
  const item = {
    status: "published",
    i18n: {
      en: { name: "Guru Nanak Jayanti", note: "Birth anniversary of Guru Nanak Dev Ji." },
      hi: { name: "गुरु नानक जयंती", review: approved },
      mr: { name: "गुरु नानक जयंती", note: "…", review: pending },
    },
  };
  it("returns English for en", () => {
    expect(localizeItem(item, "en")).toMatchObject({ name: "Guru Nanak Jayanti", lang: "en", fellBack: false });
  });
  it("merges an approved block field by field, flagging the partial fallback", () => {
    const r = localizeItem(item, "hi");
    expect(r.name).toBe("गुरु नानक जयंती");
    expect(r.note).toBe(item.i18n.en.note);
    expect(r.fellBack).toBe(true);
  });
  it("falls back to the whole English item when the block is not approved", () => {
    expect(localizeItem(item, "mr")).toMatchObject({ name: "Guru Nanak Jayanti", lang: "en", fellBack: true });
  });
  it("filters to published items", () => {
    expect(publishedOnly([{ status: "draft" }, { status: "published" }])).toHaveLength(1);
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

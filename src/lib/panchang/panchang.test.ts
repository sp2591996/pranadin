import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { CITIES, DEFAULT_CITY_ID, getCity } from "@/lib/cities";
import { localDateKey } from "@/i18n/format";
import {
  elongation,
  lunationAround,
  moonLongitude,
  moonSidereal,
  norm360,
  sunLongitude,
  sunTimes,
} from "./astronomy";
import { __clearPanchangCache, panchangForDay, panchangRange, TITHI_NAMES_EN } from "./index";

const angDiff = (a: number, b: number) => {
  const d = Math.abs(norm360(a) - norm360(b)) % 360;
  return d > 180 ? 360 - d : d;
};
const hours = (ms: number) => ms / 3600_000;

beforeEach(() => __clearPanchangCache());

describe("astronomy core against published examples", () => {
  it("Sun: Meeus example 25.a (1992 Oct 13, 0h TD) apparent λ = 199.90895°", () => {
    expect(angDiff(sunLongitude(2448908.5), 199.90895)).toBeLessThan(0.002);
  });

  it("Moon: Meeus example 47.a (1992 Apr 12, 0h TD) λ = 133.162655° (truncated series)", () => {
    expect(angDiff(moonLongitude(2448724.5), 133.162655)).toBeLessThan(0.05);
  });

  // Eclipses occur at syzygy, so elongation must be ~0° (solar) or ~180° (lunar).
  // Times: NASA Five Millennium Canon, greatest eclipse (UT), rounded.
  it.each([
    ["annular solar eclipse 2026-02-17", Date.UTC(2026, 1, 17, 12, 12), 0],
    ["total lunar eclipse 2026-03-03", Date.UTC(2026, 2, 3, 11, 33), 180],
    ["total solar eclipse 2026-08-12", Date.UTC(2026, 7, 12, 17, 46), 0],
    ["partial lunar eclipse 2026-08-28", Date.UTC(2026, 7, 28, 4, 12), 180],
  ])("%s: elongation near syzygy", (_label, t, target) => {
    expect(angDiff(elongation(t), target)).toBeLessThan(1.5);
  });

  it("finds the new moon that brackets an instant", () => {
    const t = Date.UTC(2026, 7, 20);
    const { prev, next } = lunationAround(t);
    expect(prev).toBeLessThanOrEqual(t);
    expect(next).toBeGreaterThan(t);
    expect((next - prev) / 86_400_000).toBeGreaterThan(29.2);
    expect((next - prev) / 86_400_000).toBeLessThan(29.9);
    // The 2026-08-12 total solar eclipse is that new moon.
    expect(Math.abs(hours(prev - Date.UTC(2026, 7, 12, 17, 46)))).toBeLessThan(2);
  });
});

describe("sunrise and sunset", () => {
  it("equator at the March equinox: sunrise near 06:00 UTC, day ≈ 12h07m", () => {
    const s = sunTimes(2026, 3, 20, 0, 0);
    const h = hours(s.sunrise! - Date.UTC(2026, 2, 20));
    expect(h).toBeGreaterThan(5.85);
    expect(h).toBeLessThan(6.25);
    expect(hours(s.sunset! - s.sunrise!)).toBeCloseTo(12.12, 1);
  });

  it("New Delhi day length is longest in June and shortest in December", () => {
    const c = getCity("new-delhi");
    const jun = sunTimes(2026, 6, 21, c.lat, c.lng);
    const dec = sunTimes(2026, 12, 21, c.lat, c.lng);
    expect(hours(jun.sunset! - jun.sunrise!)).toBeGreaterThan(13.8);
    expect(hours(jun.sunset! - jun.sunrise!)).toBeLessThan(14.1);
    expect(hours(dec.sunset! - dec.sunrise!)).toBeGreaterThan(10.2);
    expect(hours(dec.sunset! - dec.sunrise!)).toBeLessThan(10.5);
  });

  it("every city's sunrise falls on the requested local date, between 04:00 and 09:00 local", () => {
    for (const c of CITIES) {
      for (const date of ["2026-11-20", "2027-01-15", "2027-06-21"]) {
        const p = panchangForDay(date, c);
        expect(p.sunrise, c.id).not.toBeNull();
        expect(localDateKey(p.sunrise!, c.tz), `${c.id} ${date}`).toBe(date);
        const localH = Number(
          new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: c.tz }).format(p.sunrise!),
        );
        expect(localH, `${c.id} ${date}`).toBeGreaterThanOrEqual(4);
        expect(localH, `${c.id} ${date}`).toBeLessThan(9);
      }
    }
  });

  it("handles polar night without crashing", () => {
    const tromso = { id: "tromso", name: "Tromsø", lat: 69.6492, lng: 18.9553, tz: "Europe/Oslo", country: "NO" };
    const p = panchangForDay("2026-12-21", tromso);
    expect(p.sunrise).toBeNull();
    expect(p.tithi.index).toBeGreaterThanOrEqual(0);
  });
});

describe("panchangForDay", () => {
  it("is always marked indicative and uses the amanta convention", () => {
    const p = panchangForDay("2026-11-20", "pune");
    expect(p.indicative).toBe(true);
    expect(p.masa.convention).toBe("amanta");
    expect(p.timeZone).toBe("Asia/Kolkata");
  });

  it("reports the tithi prevailing at sunrise, and when it ends", () => {
    for (const date of ["2026-11-20", "2026-12-01", "2027-01-14", "2027-02-28"]) {
      const p = panchangForDay(date, "mumbai");
      const sr = p.sunrise!;
      expect(Math.floor(elongation(sr) / 12)).toBe(p.tithi.index);
      expect(p.tithi.endsAt).toBeGreaterThan(sr);
      expect(hours(p.tithi.endsAt - sr)).toBeLessThan(27);
      expect(Math.floor(elongation(p.tithi.endsAt + 60_000) / 12)).toBe((p.tithi.index + 1) % 30);
      expect(Math.floor(elongation(p.tithi.endsAt - 60_000) / 12)).toBe(p.tithi.index);
      expect(p.tithi.number).toBe((p.tithi.index % 15) + 1);
      expect(p.tithi.paksha).toBe(p.tithi.index < 15 ? "shukla" : "krishna");
    }
  });

  it("reports nakshatra and pada at sunrise, and when it ends", () => {
    const p = panchangForDay("2026-11-20", "new-delhi");
    const span = 360 / 27;
    expect(Math.floor(moonSidereal(p.sunrise!) / span)).toBe(p.nakshatra.index);
    expect(Math.floor(moonSidereal(p.nakshatra.endsAt + 60_000) / span)).toBe((p.nakshatra.index + 1) % 27);
    expect([1, 2, 3, 4]).toContain(p.nakshatra.pada);
  });

  it("can differ between cities on the same date (sunrise rule), but each is self-consistent", () => {
    const a = panchangForDay("2026-11-20", "kolkata");
    const b = panchangForDay("2026-11-20", "san-jose");
    expect(a.sunrise).not.toBe(b.sunrise);
  });

  it("detects Adhik Jyeshtha 2026 (17 May – 15 Jun 2026 in published calendars)", () => {
    const adhik = panchangForDay("2026-06-01", "new-delhi");
    expect(adhik.masa).toMatchObject({ index: 2, adhik: true });
    const nija = panchangForDay("2026-07-01", "new-delhi");
    expect(nija.masa).toMatchObject({ index: 2, adhik: false });
    const before = panchangForDay("2026-05-10", "new-delhi");
    expect(before.masa).toMatchObject({ index: 1, adhik: false });
  });

  it("puts the launch window in Kartika then Margashirsha (amanta)", () => {
    expect(panchangForDay("2026-11-20", "pune").masa).toMatchObject({ index: 7, adhik: false });
    expect(panchangForDay("2026-12-20", "pune").masa).toMatchObject({ index: 8, adhik: false });
  });

  it("defaults to New Delhi when no city is set", () => {
    expect(panchangForDay("2026-11-20", null).cityId).toBe(DEFAULT_CITY_ID);
  });

  it("memoises: the same day and city returns the same object", () => {
    expect(panchangForDay("2026-11-21", "pune")).toBe(panchangForDay("2026-11-21", "pune"));
  });

  it("computes today + 7 days within the performance budget (prototype P4)", () => {
    const t0 = performance.now();
    const days = panchangRange("2026-11-20", 8, "pune");
    const ms = performance.now() - t0;
    expect(days).toHaveLength(8);
    expect(days[7]!.date).toBe("2026-11-27");
    // Budget is 30 ms on a 4x-throttled phone; a dev machine should be far below 30 ms.
    expect(ms).toBeLessThan(30);
  });

  it("has 30 tithi names with Purnima and Amavasya in place", () => {
    expect(TITHI_NAMES_EN).toHaveLength(30);
    expect(TITHI_NAMES_EN[14]).toBe("Purnima");
    expect(TITHI_NAMES_EN[29]).toBe("Amavasya");
  });
});

/**
 * Golden file (ADR-008, PR-9). Content supplies reference values from two
 * published panchangs in tests/golden/panchang-reference.json. Every case
 * must match: tithi and nakshatra at sunrise exactly; sunrise/sunset ±2 min.
 */
interface GoldenCase {
  date: string;
  cityId: string;
  tithiIndex: number;
  nakshatraIndex: number;
  sunrise: string; // HH:MM local
  sunset?: string;
  source: string;
}
const goldenFile = path.join(process.cwd(), "tests", "golden", "panchang-reference.json");
const golden = JSON.parse(fs.readFileSync(goldenFile, "utf8")) as { cases: GoldenCase[] };

describe("golden reference cases", () => {
  it("file is well-formed", () => {
    expect(Array.isArray(golden.cases)).toBe(true);
    if (golden.cases.length === 0) console.info("[panchang golden] 0 cases yet: awaiting Content reference data (PR-9)");
  });

  const toLocalMinutes = (ms: number, tz: string) => {
    const [h, m] = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz })
      .format(ms)
      .split(":")
      .map(Number);
    return h! * 60 + m!;
  };
  const hm = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

  it.each(golden.cases.map((c) => [`${c.date} ${c.cityId}`, c] as const))("%s", (_n, c) => {
    const city = getCity(c.cityId);
    expect(city.id, "unknown cityId").toBe(c.cityId);
    const p = panchangForDay(c.date, city);
    expect(p.tithi.index, `tithi (${c.source})`).toBe(c.tithiIndex);
    expect(p.nakshatra.index, `nakshatra (${c.source})`).toBe(c.nakshatraIndex);
    expect(Math.abs(toLocalMinutes(p.sunrise!, city.tz) - hm(c.sunrise))).toBeLessThanOrEqual(2);
    if (c.sunset) expect(Math.abs(toLocalMinutes(p.sunset!, city.tz) - hm(c.sunset))).toBeLessThanOrEqual(2);
  });
});

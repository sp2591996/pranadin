/**
 * Panchang lite (E-05, FR-8, ADR-008). Indicative values for one local day
 * in one city: sunrise, sunset, tithi and nakshatra **at local sunrise**
 * (fixes prototype P2), amanta month with Adhik detection (fixes P1), all
 * day boundaries in the city's time zone (fixes P3), memoised (fixes P4).
 *
 * Festivals are NOT derived here. They come from Content's curated table.
 * Rahu Kaal, muhurta, yoga and karana are deliberately not computed (FR-8.5,
 * content red lines).
 */
import type { City } from "@/lib/cities";
import { getCity } from "@/lib/cities";
import { addDays, parseDateKey } from "@/i18n/format";
import type { LocalDateKey, PanchangDay } from "@/lib/types";
import {
  elongation,
  lunationAround,
  moonSidereal,
  nextBoundary,
  sunSidereal,
  sunTimes,
} from "./astronomy";

export { TITHI_NAMES_EN, NAKSHATRA_NAMES_EN, MASA_NAMES_EN, tithiNameEn } from "./names";

const NAKSHATRA_SPAN = 360 / 27;
const cache = new Map<string, PanchangDay>();
const MAX_CACHE = 400;

/** Panchang for a local calendar day in a city (memoised). */
export function panchangForDay(date: LocalDateKey, cityOrId: City | string | null): PanchangDay {
  const city = typeof cityOrId === "object" && cityOrId !== null ? cityOrId : getCity(cityOrId);
  const key = `${date}|${city.id}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { y, m, d } = parseDateKey(date);
  const sun = sunTimes(y, m, d, city.lat, city.lng);
  // Polar day/night has no sunrise; use solar noon as the reference instant.
  const ref = sun.sunrise ?? sun.solarNoon;

  const e = elongation(ref);
  const tithiIndex = Math.min(29, Math.floor(e / 12));
  const tithiEnds = nextBoundary(elongation, 12, ref);

  const ms = moonSidereal(ref);
  const nIndex = Math.min(26, Math.floor(ms / NAKSHATRA_SPAN));
  const pada = (Math.min(3, Math.floor(((ms % NAKSHATRA_SPAN) / NAKSHATRA_SPAN) * 4)) + 1) as 1 | 2 | 3 | 4;
  const nEnds = nextBoundary(moonSidereal, NAKSHATRA_SPAN, ref);

  // Amanta month: named from the Sun's sidereal sign at the new moon that
  // starts it (Sun in Meena → Chaitra). No sankranti before the next new
  // moon (same sign at both) → Adhik month.
  const { prev, next } = lunationAround(ref);
  const signPrev = Math.floor(sunSidereal(prev) / 30);
  const signNext = Math.floor(sunSidereal(next) / 30);

  const day: PanchangDay = {
    date,
    cityId: city.id,
    timeZone: city.tz,
    indicative: true,
    sunrise: sun.sunrise === null ? null : Math.round(sun.sunrise),
    sunset: sun.sunset === null ? null : Math.round(sun.sunset),
    tithi: {
      index: tithiIndex,
      number: (tithiIndex % 15) + 1,
      paksha: tithiIndex < 15 ? "shukla" : "krishna",
      endsAt: tithiEnds,
    },
    nakshatra: { index: nIndex, pada, endsAt: nEnds },
    masa: { index: (signPrev + 1) % 12, adhik: signPrev === signNext, convention: "amanta" },
  };

  if (cache.size >= MAX_CACHE) cache.clear();
  cache.set(key, day);
  return day;
}

/** Today plus the next `days` days (Today screen and Calendar strip). */
export function panchangRange(start: LocalDateKey, days: number, city: City | string | null): PanchangDay[] {
  return Array.from({ length: days }, (_, i) => panchangForDay(addDays(start, i), city));
}

export function __clearPanchangCache(): void {
  cache.clear();
}

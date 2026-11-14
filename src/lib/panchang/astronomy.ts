/**
 * Astronomy core, ported from the prototype (`Code/src/lib/panchang.ts`,
 * read-only) per ADR-002/ADR-008. Pure functions, no dependencies.
 *
 * - Sun: Meeus ch. 25 low-accuracy apparent longitude (~0.01°).
 * - Moon: Meeus ch. 47, first 22 terms of table 47.A (~0.05°).
 * - Ayanamsa: Lahiri, linear approximation.
 * - Sunrise/sunset: NOAA-style sunrise equation, -0.833° altitude (~±2 min).
 *
 * Changes from the prototype: inputs are epoch ms or explicit calendar
 * parts (no hidden `Date` local-time use), a ΔT correction is applied to
 * the lunar/solar positions, and crossing finders give tithi/nakshatra end times.
 */

const D2R = Math.PI / 180;
const DAY_MS = 86_400_000;

/**
 * ΔT = TT − UT. About 69 s for 2025–2027 (IERS). Applied so that positions
 * are evaluated in dynamical time; it moves tithi end times by about a minute.
 */
export const DELTA_T_SEC = 69;

export function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}
const sind = (x: number) => Math.sin(x * D2R);

/** Julian Day (UT) from epoch milliseconds. */
export function julianDay(ms: number): number {
  return ms / DAY_MS + 2440587.5;
}
export function msFromJulianDay(jd: number): number {
  return (jd - 2440587.5) * DAY_MS;
}

/** Julian Ephemeris Day (TT) for an instant given in epoch ms (UT). */
export function jde(ms: number): number {
  return julianDay(ms + DELTA_T_SEC * 1000);
}

/** Apparent geocentric ecliptic longitude of the Sun (tropical, degrees), JDE input. */
export function sunLongitude(jdeTT: number): number {
  const T = (jdeTT - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sind(M) +
    (0.019993 - 0.000101 * T) * sind(2 * M) +
    0.000289 * sind(3 * M);
  const omega = 125.04 - 1934.136 * T;
  return norm360(L0 + C - 0.00569 - 0.00478 * sind(omega));
}

// [D, M, M', F, Σl coefficient] — first 22 terms of Meeus table 47.A
const MOON_TERMS: readonly (readonly [number, number, number, number, number])[] = [
  [0, 0, 1, 0, 6288774],
  [2, 0, -1, 0, 1274027],
  [2, 0, 0, 0, 658314],
  [0, 0, 2, 0, 213618],
  [0, 1, 0, 0, -185116],
  [0, 0, 0, 2, -114332],
  [2, 0, -2, 0, 58793],
  [2, -1, -1, 0, 57066],
  [2, 0, 1, 0, 53322],
  [2, -1, 0, 0, 45758],
  [0, 1, -1, 0, -40923],
  [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383],
  [2, 0, 0, -2, 15327],
  [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980],
  [4, 0, -1, 0, 10675],
  [0, 0, 3, 0, 10034],
  [4, 0, -2, 0, 8548],
  [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766],
  [1, 0, -1, 0, -5163],
];

/** Geocentric ecliptic longitude of the Moon (tropical, degrees), JDE input. */
export function moonLongitude(jdeTT: number): number {
  const T = (jdeTT - 2451545.0) / 36525;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
  const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;
  // Eccentricity correction for terms involving M (Meeus 47.6).
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  let sum = 0;
  for (const [cd, cm, cmp, cf, sc] of MOON_TERMS) {
    const e = cm === 0 ? 1 : Math.abs(cm) === 1 ? E : E * E;
    sum += sc * e * sind(cd * D + cm * M + cmp * Mp + cf * F);
  }
  return norm360(Lp + sum / 1e6);
}

/** Lahiri ayanamsa (degrees), linear approximation: 23.853° at J2000, 50.3″/year. */
export function ayanamsa(jdeTT: number): number {
  return 23.8531 + ((jdeTT - 2451545.0) / 365.25) * 0.013972;
}

export function sidereal(tropical: number, jdeTT: number): number {
  return norm360(tropical - ayanamsa(jdeTT));
}

/** Moon − Sun longitude (0..360). Ayanamsa cancels, so this is frame-independent. */
export function elongation(ms: number): number {
  const t = jde(ms);
  return norm360(moonLongitude(t) - sunLongitude(t));
}

export function moonSidereal(ms: number): number {
  const t = jde(ms);
  return sidereal(moonLongitude(t), t);
}

export function sunSidereal(ms: number): number {
  const t = jde(ms);
  return sidereal(sunLongitude(t), t);
}

export interface SunTimes {
  sunrise: number | null;
  sunset: number | null;
  solarNoon: number;
  /** Sun never rises (polar night) or never sets (midnight sun). */
  polar: "night" | "day" | null;
}

/**
 * Sunrise, sunset and solar noon for a **local calendar day** at a place.
 * `y/m/d` is the civil date in the place's own time zone; the transit that
 * the formula finds falls inside that day for any longitude in ±180°.
 * `lng` is positive east.
 */
export function sunTimes(y: number, m: number, d: number, lat: number, lng: number): SunTimes {
  const jdMidnight = julianDay(Date.UTC(y, m - 1, d));
  const n = jdMidnight - 2451545.0 + 0.5 + 0.0008 - lng / 360;
  const M = norm360(357.5291 + 0.98560028 * n);
  const C = 1.9148 * sind(M) + 0.02 * sind(2 * M) + 0.0003 * sind(3 * M);
  const lambda = norm360(M + C + 180 + 102.9372);
  const jTransit = 2451545.0 + n + 0.0053 * sind(M) - 0.0069 * sind(2 * lambda);
  const delta = Math.asin(sind(lambda) * Math.sin(23.4397 * D2R)) / D2R;
  const cosOmega =
    (Math.sin(-0.833 * D2R) - Math.sin(lat * D2R) * Math.sin(delta * D2R)) /
    (Math.cos(lat * D2R) * Math.cos(delta * D2R));
  const solarNoon = msFromJulianDay(jTransit);
  if (cosOmega > 1) return { sunrise: null, sunset: null, solarNoon, polar: "night" };
  if (cosOmega < -1) return { sunrise: null, sunset: null, solarNoon, polar: "day" };
  const omega = Math.acos(cosOmega) / D2R;
  return {
    sunrise: msFromJulianDay(jTransit - omega / 360),
    sunset: msFromJulianDay(jTransit + omega / 360),
    solarNoon,
    polar: null,
  };
}

/**
 * First instant after `startMs` at which an increasing angle `f` crosses the
 * next multiple of `step` degrees. Scans in `scanMs` steps, then bisects to
 * within one second. Used for tithi (elongation / 12°) and nakshatra
 * (moon sidereal / 13°20′) end times.
 */
export function nextBoundary(
  f: (ms: number) => number,
  step: number,
  startMs: number,
  maxDays = 3,
  scanMs = 2 * 3600_000,
): number {
  const a0 = f(startMs);
  const target = (Math.floor(a0 / step) + 1) * step - a0; // degrees still to travel
  const travelled = (ms: number) => norm360(f(ms) - a0);
  let lo = startMs;
  let hi = startMs;
  const limit = startMs + maxDays * DAY_MS;
  while (hi < limit) {
    hi = Math.min(hi + scanMs, limit);
    // Wrap guard: travel is < 360 within the scan window for both angles.
    if (travelled(hi) >= target) break;
    lo = hi;
  }
  if (travelled(hi) < target) throw new Error("nextBoundary: no crossing found in window");
  while (hi - lo > 1000) {
    const mid = (lo + hi) / 2;
    if (travelled(mid) >= target) hi = mid;
    else lo = mid;
  }
  return Math.round(hi);
}

/** Wrap an angle to (−180, 180]. */
const wrap180 = (x: number) => {
  const r = norm360(x);
  return r > 180 ? r - 360 : r;
};

/** Mean synodic rate of elongation, degrees per day. */
const SYNODIC_RATE = 360 / 29.530588;

/**
 * New moon (elongation = 0) nearest to the estimate `guessMs`.
 * Newton iteration on elongation; converges to < 1 minute in a few steps.
 */
export function newMoonNear(guessMs: number): number {
  let t = guessMs;
  for (let i = 0; i < 8; i++) {
    const err = wrap180(elongation(t));
    t -= (err / SYNODIC_RATE) * DAY_MS;
    if (Math.abs(err) < 1e-5) break;
  }
  return t;
}

/** The last new moon at or before `ms`, and the next one after it. */
export function lunationAround(ms: number): { prev: number; next: number } {
  const e = elongation(ms);
  let prev = newMoonNear(ms - (e / SYNODIC_RATE) * DAY_MS);
  if (prev > ms) prev = newMoonNear(prev - 29.53 * DAY_MS);
  let next = newMoonNear(prev + 29.53 * DAY_MS);
  if (next <= ms) next = newMoonNear(next + 29.53 * DAY_MS);
  return { prev, next };
}

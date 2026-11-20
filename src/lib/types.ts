/**
 * Shared domain types (E-02 contract). Dev-1 owns this file; changes need a
 * note in CONTRACTS.md and a heads-up to Dev-2 and Content.
 *
 * Rules:
 * - Every persisted record carries `v` (schema version) so migrations are explicit.
 * - Times are epoch milliseconds (UTC). Calendar days are `LocalDateKey`
 *   strings computed in the user's city time zone, never from UTC.
 * - IDs are stable strings. Content IDs come from `app/content/`.
 */

export const LOCALES = ["en", "hi", "mr"] as const;
export type Locale = (typeof LOCALES)[number];

/** `YYYY-MM-DD` in the user's time zone (default Asia/Kolkata). */
export type LocalDateKey = string;

/** `HH:MM`, 24-hour, local to the user's time zone. */
export type LocalTime = string;

/** IANA time-zone name, e.g. `Asia/Kolkata`. */
export type TimeZone = string;

// ---------- Preferences (localStorage, read synchronously on boot) ----------

export const GOALS = ["calm", "sleep", "focus", "devotion", "explore"] as const;
export type Goal = (typeof GOALS)[number];

export const PLAN_MINUTES = [5, 10, 20] as const;
export type PlanMinutes = (typeof PLAN_MINUTES)[number];

export const TIME_SLOTS = ["morning", "evening", "whenever"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export type ThemePref = "system" | "light" | "dark";
export type ConsentState = "unset" | "granted" | "denied";

export interface Prefs {
  v: 1;
  locale: Locale;
  goal: Goal;
  minutes: PlanMinutes;
  slot: TimeSlot;
  /** City id from `src/lib/cities.ts`. `null` = not chosen (UI shows the "New Delhi (default)" hint). */
  cityId: string | null;
  theme: ThemePref;
  /** `null` = follow the OS `prefers-reduced-motion` setting. */
  reduceMotion: boolean | null;
  /** Analytics consent (FR-2.5). No analytics event may be sent unless "granted". */
  analyticsConsent: ConsentState;
  /** Daily reminder time for the `.ics` export, or `null` for none. */
  reminderTime: LocalTime | null;
  onboarded: boolean;
}

// ---------- On-device records (IndexedDB) ----------

/**
 * Mood ids = Content's keys without the `mood.` prefix (`content/en/journal.json`),
 * in display order. Labels come from content. Content owns these names.
 */
export const MOODS = ["peaceful", "grateful", "okay", "restless", "heavy"] as const;
export type Mood = (typeof MOODS)[number];

/**
 * Ids stored by builds before 18 Nov 2026, mapped to Content's ids (same
 * meaning as Dev-2's old label map). Applied when records are read, so
 * existing journals keep their moods.
 */
export const LEGACY_MOODS: Readonly<Record<string, Mood>> = {
  bright: "peaceful",
  light: "grateful",
  steady: "okay",
  low: "restless",
};

export const JOURNAL_MAX_CHARS = 1000; // PRD FR-10.1

export interface JournalEntry {
  v: 1;
  id: string;
  createdAt: number;
  updatedAt: number;
  /** The day the entry belongs to, in the user's time zone at creation. */
  localDate: LocalDateKey;
  mood: Mood | null;
  /** Plain text only. Never render with dangerouslySetInnerHTML. */
  text: string;
  /** Content id of the prompt shown, if any. */
  promptId: string | null;
  locale: Locale;
}

export const PRACTICE_KINDS = ["breath", "stillness", "reflection", "japa"] as const;
export type PracticeKind = (typeof PRACTICE_KINDS)[number];

export interface PracticeLog {
  v: 1;
  id: string;
  /** Epoch ms when the practice ended (or was marked done). */
  at: number;
  localDate: LocalDateKey;
  kind: PracticeKind;
  /** Content id, e.g. a breath technique or stillness focus. */
  refId: string | null;
  plannedSec: number;
  actualSec: number;
  /** PRD §6: timed practice reached >= 80% of plan, or a reflection marked done. */
  completed: boolean;
  source: "plan" | "free";
}

export const COMPLETION_THRESHOLD = 0.8;

// ---------- Panchang (computed, indicative) ----------

export type Paksha = "shukla" | "krishna";

export interface PanchangDay {
  date: LocalDateKey;
  cityId: string;
  timeZone: TimeZone;
  /** Always true: computed values are labelled "Indicative · may vary by region". */
  indicative: true;
  sunrise: number | null;
  sunset: number | null;
  /** Tithi prevailing at local sunrise (FR-8.2). */
  tithi: {
    /** 0..29: 0-14 Shukla Pratipada..Purnima, 15-29 Krishna Pratipada..Amavasya. */
    index: number;
    /** 1..15 within the paksha. */
    number: number;
    paksha: Paksha;
    /** Epoch ms when this tithi ends. */
    endsAt: number;
  };
  nakshatra: { index: number; pada: 1 | 2 | 3 | 4; endsAt: number };
  /** Amanta lunar month (0 = Chaitra). */
  masa: { index: number; adhik: boolean; convention: "amanta" };
}

// ---------- Observances (curated by Content; never computed) ----------

export const TRADITIONS = [
  "hindu",
  "jain",
  "buddhist",
  "sikh",
  "christian",
  "islamic",
  "parsi",
  "national",
] as const;
export type Tradition = (typeof TRADITIONS)[number];

/**
 * Japa mala count on this device (v1). One record, id "japa". `count` is the
 * running total of beads; beads in the current mala = count % 108.
 */
export interface JapaState {
  v: 1;
  id: "japa";
  localDate: LocalDateKey;
  /** Last update, ms since epoch. */
  at: number;
  count: number;
}

/**
 * Preferences: one small versioned JSON value in localStorage, read
 * synchronously on boot so there is no flash of the wrong language or theme.
 * Falls back to memory if localStorage is blocked.
 */
import { GOALS, LOCALES, PLAN_MINUTES, TIME_SLOTS, type Prefs } from "@/lib/types";
import { PREFS_KEY } from "./schema";

/** PRD FR-2: skipping everything gives Calm, 10 min, Whenever; city unset (New Delhi used, with a hint). */
export const DEFAULT_PREFS: Readonly<Prefs> = Object.freeze({
  v: 1,
  locale: "en",
  goal: "calm",
  minutes: 10,
  slot: "whenever",
  cityId: null,
  theme: "system",
  reduceMotion: null,
  analyticsConsent: "unset",
  reminderTime: null,
  onboarded: false,
});

const oneOf = <T>(list: readonly T[], v: unknown, d: T): T => ((list as readonly unknown[]).includes(v) ? (v as T) : d);

/** Coerce anything (old versions, hand-edited values, garbage) into valid Prefs. */
export function sanitizePrefs(raw: unknown): Prefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_PREFS;
  return {
    v: 1,
    locale: oneOf(LOCALES, r.locale, d.locale),
    goal: oneOf(GOALS, r.goal, d.goal),
    minutes: oneOf(PLAN_MINUTES, r.minutes, d.minutes),
    slot: oneOf(TIME_SLOTS, r.slot, d.slot),
    cityId: typeof r.cityId === "string" && r.cityId.length > 0 ? r.cityId : null,
    theme: oneOf(["system", "light", "dark"] as const, r.theme, d.theme),
    reduceMotion: typeof r.reduceMotion === "boolean" ? r.reduceMotion : null,
    analyticsConsent: oneOf(["unset", "granted", "denied"] as const, r.analyticsConsent, d.analyticsConsent),
    reminderTime: typeof r.reminderTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.reminderTime) ? r.reminderTime : null,
    onboarded: r.onboarded === true,
  };
}

export interface PrefsStore {
  read(): Prefs;
  write(patch: Partial<Omit<Prefs, "v">>): Prefs;
  reset(): void;
  readonly persistent: boolean;
}

export function createPrefsStore(ls: Storage | null): PrefsStore {
  let memory: Prefs = { ...DEFAULT_PREFS };
  const persistent = ls !== null;
  return {
    persistent,
    read() {
      if (!ls) return { ...memory };
      try {
        const raw = ls.getItem(PREFS_KEY);
        return raw ? sanitizePrefs(JSON.parse(raw)) : { ...DEFAULT_PREFS };
      } catch {
        return { ...DEFAULT_PREFS };
      }
    },
    write(patch) {
      const next = sanitizePrefs({ ...this.read(), ...patch });
      memory = next;
      if (ls) {
        try {
          ls.setItem(PREFS_KEY, JSON.stringify(next));
        } catch {
          // Quota or blocked: keep the in-memory copy for this session.
        }
      }
      return next;
    },
    reset() {
      memory = { ...DEFAULT_PREFS };
      try {
        ls?.removeItem(PREFS_KEY);
      } catch {
        /* ignore */
      }
    },
  };
}

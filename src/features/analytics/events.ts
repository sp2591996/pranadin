/**
 * Analytics event contract (PRD §10, L5 4.2). Only these 9 events, only
 * these properties. Pure: no browser APIs, so it is unit-tested.
 */
export interface EventProps {
  onboarding_completed: { lang: string; goal: string; minutes: number; city_set: boolean };
  practice_completed: { type: "breath" | "stillness" | "reflection"; planned_min: number; actual_min: number; entry: "plan" | "practice_tab" };
  practice_abandoned: { type: "breath" | "stillness" | "reflection"; actual_min: number };
  daily_plan_completed: { minutes: number };
  calendar_viewed: Record<string, never>;
  journal_saved: Record<string, never>;
  language_changed: { to: string };
  feedback_opened: Record<string, never>;
  consent_updated: { analytics: "on" };
}
export type EventName = keyof EventProps;

const ALLOWED: { [K in EventName]: readonly (keyof EventProps[K])[] } = {
  onboarding_completed: ["lang", "goal", "minutes", "city_set"],
  practice_completed: ["type", "planned_min", "actual_min", "entry"],
  practice_abandoned: ["type", "actual_min"],
  daily_plan_completed: ["minutes"],
  calendar_viewed: [],
  journal_saved: [],
  language_changed: ["to"],
  feedback_opened: [],
  consent_updated: ["analytics"],
};

export interface CommonProps {
  install_id: string;
  lang: string;
  app_version: string;
  local_date: string;
  platform: "android" | "ios" | "desktop";
}

export type Payload = Record<string, string | number | boolean>;

/** Keep only the allow-listed properties and primitive values; drop anything else. */
export function buildPayload<K extends EventName>(name: K, props: EventProps[K], common: CommonProps): Payload {
  if (!(name in ALLOWED)) throw new Error(`Unknown analytics event: ${name}`);
  const out: Payload = { ...common };
  const src = props as Record<string, unknown>;
  for (const k of ALLOWED[name] as readonly string[]) {
    const v = src[k];
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  return out;
}

/** Coarse platform only; no fingerprinting (L5 4.3). */
export function platformOf(userAgent: string): CommonProps["platform"] {
  if (/Android/i.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  return "desktop";
}

export interface AnalyticsConfig {
  provider: string | undefined;
  env: string | undefined;
}

/**
 * Sending is allowed only when a provider is configured, this is the
 * production deployment (L5 6.3), and the user said Yes (FR-2.4).
 */
export function canSend(cfg: AnalyticsConfig, consent: string): boolean {
  return !!cfg.provider && cfg.provider !== "none" && cfg.env === "production" && consent === "granted";
}

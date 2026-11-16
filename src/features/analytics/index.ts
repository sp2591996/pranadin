/**
 * The single analytics adapter (E-13*, PRD §10, L5 §4).
 *
 *   track("practice_completed", { type: "breath", planned_min: 3, actual_min: 3, entry: "practice_tab" });
 *
 * Default: **no-op.** Nothing is sent, and no analytics code is loaded,
 * unless ALL of these hold:
 *   1. a provider is configured at build time: `NEXT_PUBLIC_ANALYTICS_PROVIDER=umami`
 *      plus `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (and optionally `NEXT_PUBLIC_UMAMI_HOST`);
 *   2. it is the production deployment (`NEXT_PUBLIC_VERCEL_ENV=production`, L5 6.3);
 *   3. the user tapped Yes (`prefs.analyticsConsent === "granted"`).
 * Before turning (1) on: the Board creates the free account, Legal names the
 * tool in the privacy notice, and Dev-1 adds its host to CSP `connect-src`
 * (see docs/contract-requests.md, CR-D2-04).
 */
import { localDateKey } from "@/i18n/format";
import { getPrefs } from "@/lib/storage";
import { newId } from "@/lib/storage";
import { readLocal, removeLocal, userTimeZone, writeLocal } from "@/features/shared/device";
import { buildPayload, canSend, platformOf, type EventName, type EventProps, type Payload } from "./events";

export type { EventName, EventProps } from "./events";

export interface AnalyticsAdapter {
  send(name: EventName, payload: Payload): void;
}

export const noopAdapter: AnalyticsAdapter = { send() {} };

const CONFIG = {
  provider: process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER,
  env: process.env.NEXT_PUBLIC_VERCEL_ENV,
};
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
const INSTALL_ID_KEY = "analytics.installId.v1";

let adapterPromise: Promise<AnalyticsAdapter> | null = null;

function loadAdapter(): Promise<AnalyticsAdapter> {
  adapterPromise ??=
    CONFIG.provider === "umami"
      ? import("./umami").then((m) => m.createUmamiAdapter()).catch(() => noopAdapter)
      : Promise.resolve(noopAdapter);
  return adapterPromise;
}

/** True when events would actually leave the device. */
export function analyticsActive(): boolean {
  return canSend(CONFIG, getPrefs().read().analyticsConsent);
}

/** Whether a tool is configured in this build (the Me screen says so if not). */
export const analyticsConfigured = !!CONFIG.provider && CONFIG.provider !== "none";

function installId(): string {
  let id = readLocal<string | null>(INSTALL_ID_KEY, null);
  if (!id) {
    id = newId();
    writeLocal(INSTALL_ID_KEY, id);
  }
  return id;
}

export function track<K extends EventName>(name: K, props: EventProps[K]): void {
  try {
    if (typeof window === "undefined" || !analyticsActive()) return;
    const prefs = getPrefs().read();
    const payload = buildPayload(name, props, {
      install_id: installId(),
      lang: prefs.locale,
      app_version: APP_VERSION,
      local_date: localDateKey(Date.now(), userTimeZone()),
      platform: platformOf(navigator.userAgent),
    });
    void loadAdapter().then((a) => a.send(name, payload));
  } catch {
    /* analytics must never break the app */
  }
}

/**
 * Record the user's choice. Turning on sends `consent_updated` (only then);
 * turning off stops sending at once and deletes the install ID (US-06).
 */
export function setAnalyticsConsent(granted: boolean): void {
  getPrefs().write({ analyticsConsent: granted ? "granted" : "denied" });
  if (granted) track("consent_updated", { analytics: "on" });
  else {
    removeLocal(INSTALL_ID_KEY);
    adapterPromise = null;
  }
}

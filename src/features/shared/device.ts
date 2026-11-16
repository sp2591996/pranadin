/**
 * Device-only helpers shared by Dev-2 features. Every key uses the
 * `pranadin.` prefix so "Clear my data" removes it (FR-9, L5 2.1/2.3).
 */
import { localDateKey } from "@/i18n/format";
import { getCity } from "@/lib/cities";
import { getPrefs, probeLocalStorage, STORAGE_PREFIX } from "@/lib/storage";
import type { LocalDateKey } from "@/lib/types";

export const localKey = (name: string) => `${STORAGE_PREFIX}${name}`;

export function readLocal<T>(name: string, fallback: T): T {
  try {
    const raw = probeLocalStorage()?.getItem(localKey(name));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(name: string, value: unknown): void {
  try {
    probeLocalStorage()?.setItem(localKey(name), JSON.stringify(value));
  } catch {
    /* blocked or full: the feature still works for this session */
  }
}

export function removeLocal(name: string): void {
  try {
    probeLocalStorage()?.removeItem(localKey(name));
  } catch {
    /* ignore */
  }
}

/** The user's time zone: from their chosen city (default New Delhi). */
export function userTimeZone(): string {
  return getCity(getPrefs().read().cityId).tz;
}

export function todayKey(now: number = Date.now()): LocalDateKey {
  return localDateKey(now, userTimeZone());
}

/** Save text as a file on the device (Blob download; nothing is uploaded, L5 2.4). */
export function downloadText(filename: string, mime: string, text: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Reduced motion: Settings wins in both directions, else the OS setting (DS-5 1.7). */
export function prefersReducedMotion(): boolean {
  const pref = getPrefs().read().reduceMotion;
  if (pref !== null) return pref;
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Apply the motion preference to <html data-motion> so tokens.css follows it. */
export function applyMotionAttr(pref: boolean | null): void {
  const el = document.documentElement;
  if (pref === null) el.removeAttribute("data-motion");
  else el.setAttribute("data-motion", pref ? "reduce" : "full");
}

"use client";

import { useEffect, useRef } from "react";

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

/** Keep the screen on while `active` (DS-5 §1.5). Silent where unsupported. */
export function useWakeLock(active: boolean): void {
  const lock = useRef<WakeLockSentinelLike | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<WakeLockSentinelLike> } };
    if (!active || !nav.wakeLock) return;
    let cancelled = false;
    const request = () =>
      nav.wakeLock!
        .request("screen")
        .then((l) => {
          if (cancelled) void l.release();
          else lock.current = l;
        })
        .catch(() => {});
    void request();
    const onVis = () => document.visibilityState === "visible" && void request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock.current?.release().catch(() => {});
      lock.current = null;
    };
  }, [active]);
}

/** Call `onHide` when the page is hidden (phone locked, app switched): FR-4.4, US-13. */
export function useOnHidden(onHide: () => void): void {
  const cb = useRef(onHide);
  useEffect(() => {
    cb.current = onHide;
  });
  useEffect(() => {
    const onVis = () => document.visibilityState === "hidden" && cb.current();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onVis);
    };
  }, []);
}

/** Space toggles pause/resume, Esc asks to end (DS-5 §1.6). */
export function useSessionKeys(enabled: boolean, onToggle: () => void, onEscape: () => void): void {
  const cbs = useRef({ onToggle, onEscape });
  useEffect(() => {
    cbs.current = { onToggle, onEscape };
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest("button, a, input, textarea, select, [role=switch], [role=radio]");
      if (e.key === " " && !interactive) {
        e.preventDefault();
        cbs.current.onToggle();
      } else if (e.key === "Escape") {
        cbs.current.onEscape();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

"use client";

/**
 * Applies device-only display settings on every page: text size (QA-06) and
 * the "Reduce motion" choice (CR-D2-06). Dev-1 mounts it once in the locale
 * layout next to `<ThemeSync/>`.
 */
import { useEffect } from "react";
import { applyMotionAttr } from "@/features/shared/device";
import { getPrefs } from "@/lib/storage";
import { applyTextSize, readTextSize } from "./display";

export function DisplaySync() {
  useEffect(() => {
    applyTextSize(readTextSize());
    applyMotionAttr(getPrefs().read().reduceMotion);
  }, []);
  return null;
}

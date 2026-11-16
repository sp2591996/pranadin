"use client";

import { useEffect } from "react";
import { getPrefs } from "@/lib/storage";

/**
 * Applies the stored theme choice (System / Light / Dark) as `data-theme`
 * on <html>; "system" removes it so the OS preference applies. Runs after
 * hydration. A pre-paint inline script could remove the brief flash for
 * users who override the OS theme (the build's CSP hashing would cover it).
 */
export function ThemeSync() {
  useEffect(() => {
    const { theme } = getPrefs().read();
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, []);
  return null;
}

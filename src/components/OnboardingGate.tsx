"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { PREFS_KEY } from "@/lib/storage/schema";
import { OPEN } from "./gate";

export function OnboardingGate() {
  const path = usePathname();
  useEffect(() => {
    if (!path || OPEN.test(path)) return;
    try {
      const v = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null") as { onboarded?: boolean } | null;
      if (!v || v.onboarded !== true) {
        const l = /^\/(en|hi|mr)\//.exec(path)?.[1] ?? "en";
        window.location.replace(`/${l}/onboarding/`);
      }
    } catch {
      /* storage unavailable: don't lock the user out */
    }
  }, [path]);
  return null;
}

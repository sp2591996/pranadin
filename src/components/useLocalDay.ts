"use client";

import { useEffect, useState } from "react";
import { localDateKey, localHour } from "@/i18n/format";
import { DEFAULT_CITY_ID, getCity, type City } from "@/lib/cities";
import { getPrefs } from "@/lib/storage";
import type { LocalDateKey } from "@/lib/types";

export interface LocalDay {
  city: City;
  citySet: boolean;
  dateKey: LocalDateKey;
  /** null until the device clock has been read. */
  hour: number | null;
  /** false while showing the build-time snapshot (static HTML, before hydration). */
  live: boolean;
}

/**
 * The user's city and local day. The static HTML is rendered with the build
 * date (`buildDate`) so the page has real content before JavaScript runs
 * (LCP, QA-09); on the device it switches to the real day and city, and
 * re-checks whenever the tab becomes visible (day roll-over, FR-3.5).
 */
export function useLocalDay(buildDate: LocalDateKey): LocalDay {
  const [day, setDay] = useState<LocalDay>(() => ({
    city: getCity(DEFAULT_CITY_ID),
    citySet: false,
    dateKey: buildDate,
    hour: null,
    live: false,
  }));
  useEffect(() => {
    const read = () => {
      const prefs = getPrefs().read();
      const city = getCity(prefs.cityId);
      const now = Date.now();
      setDay({ city, citySet: prefs.cityId !== null, dateKey: localDateKey(now, city.tz), hour: localHour(now, city.tz), live: true });
    };
    const onVis = () => {
      if (document.visibilityState === "visible") read();
    };
    // Deferred one frame so the static content paints first.
    const id = requestAnimationFrame(read);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return day;
}

/** Trip plan on the device (IndexedDB store `trips`, DB v4; falls back like the other stores). */
import { todayKey } from "@/features/shared/device";
import { getStorage } from "@/lib/storage";
import type { TripPlan } from "@/lib/types";
import { sanitizeItems, type TripItem } from "./plan-logic";

export async function loadTrip(validIds: string[]): Promise<{ items: TripItem[]; saved: boolean }> {
  try {
    const s = await getStorage();
    const t = await s.trips.get("trip");
    return { items: sanitizeItems(t?.items, validIds), saved: s.backend !== "memory" };
  } catch {
    return { items: [], saved: false };
  }
}

export async function saveTrip(items: TripItem[]): Promise<boolean> {
  try {
    const s = await getStorage();
    const rec: TripPlan = { v: 1, id: "trip", localDate: todayKey(), at: Date.now(), items };
    await s.trips.put(rec);
    return s.backend !== "memory";
  } catch {
    return false;
  }
}

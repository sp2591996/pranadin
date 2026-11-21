/** Yoga programme progress on the device (IndexedDB store `yogaProgress`, DB v3). */
import { todayKey, readLocal, writeLocal } from "@/features/shared/device";
import { getStorage } from "@/lib/storage";
import type { YogaProgress } from "@/lib/types";
import { markDay, unmarkDay } from "./logic";

export async function loadProgress(id: string): Promise<{ progress: YogaProgress | undefined; saved: boolean }> {
  try {
    const s = await getStorage();
    return { progress: await s.yogaProgress.get(id), saved: s.backend !== "memory" };
  } catch {
    return { progress: undefined, saved: false };
  }
}

export async function loadAllProgress(): Promise<Record<string, YogaProgress>> {
  try {
    const s = await getStorage();
    return Object.fromEntries((await s.yogaProgress.list()).map((p) => [p.id, p]));
  } catch {
    return {};
  }
}

export async function setDay(id: string, day: number, total: number, done: boolean): Promise<YogaProgress | undefined> {
  try {
    const s = await getStorage();
    const cur = await s.yogaProgress.get(id);
    const next = done ? markDay(cur, id, day, total, todayKey()) : cur ? unmarkDay(cur, day, todayKey()) : undefined;
    if (next) await s.yogaProgress.put(next);
    return next;
  } catch {
    return undefined;
  }
}

export async function resetProgram(id: string): Promise<void> {
  try {
    const s = await getStorage();
    await s.yogaProgress.delete(id);
  } catch {
    /* nothing to clear */
  }
}

const ACK_KEY = "yoga.safetyAck.v1";
/** The safety notice is shown before the first session, then one tap away. */
export const hasAckedSafety = () => readLocal<boolean>(ACK_KEY, false);
export const ackSafety = () => writeLocal(ACK_KEY, true);

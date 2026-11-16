/** Practice persistence on the device: the log (IndexedDB via E-04), caution acknowledgements and sound settings. */
import { track } from "@/features/analytics";
import { readLocal, todayKey, writeLocal } from "@/features/shared/device";
import { getStorage, newId } from "@/lib/storage";
import type { PracticeKind, PracticeLog } from "@/lib/types";
import { isComplete } from "./engine";
import { computeProgress, type Progress } from "./streak";

export interface SessionResult {
  kind: Extract<PracticeKind, "breath" | "stillness">;
  refId: string | null;
  plannedSec: number;
  actualSec: number;
  source: "plan" | "free";
}

/** Save a finished or ended session. Returns whether it counted as complete. */
export async function recordSession(r: SessionResult): Promise<{ completed: boolean; saved: boolean }> {
  const completed = isComplete(r.actualSec, r.plannedSec);
  const actualMin = Math.round(r.actualSec / 60);
  if (completed) {
    track("practice_completed", {
      type: r.kind,
      planned_min: Math.round(r.plannedSec / 60),
      actual_min: actualMin,
      entry: r.source === "plan" ? "plan" : "practice_tab",
    });
  } else {
    track("practice_abandoned", { type: r.kind, actual_min: actualMin });
  }
  if (!completed && r.actualSec < 10) return { completed, saved: false };
  const entry: PracticeLog = {
    v: 1,
    id: newId(),
    at: Date.now(),
    localDate: todayKey(),
    kind: r.kind,
    refId: r.refId,
    plannedSec: Math.round(r.plannedSec),
    actualSec: Math.round(r.actualSec),
    completed,
    source: r.source,
  };
  try {
    const s = await getStorage();
    await s.practiceLog.put(entry);
    return { completed, saved: s.backend !== "memory" };
  } catch {
    return { completed, saved: false };
  }
}

export async function loadProgress(): Promise<Progress> {
  try {
    const s = await getStorage();
    return computeProgress(await s.practiceLog.list(), todayKey());
  } catch {
    return computeProgress([], todayKey());
  }
}

const ACK_KEY = "practice.cautionAck.v1";
/** FR-4.3 / US-12: the caution is acknowledged once per technique. */
export const hasAcknowledged = (id: string) => readLocal<string[]>(ACK_KEY, []).includes(id);
export function acknowledge(id: string): void {
  const list = readLocal<string[]>(ACK_KEY, []);
  if (!list.includes(id)) writeLocal(ACK_KEY, [...list, id]);
}

export interface SoundSettings {
  chime: boolean;
  haptic: boolean;
  /** 0..10 */
  volume: number;
}
const SOUND_KEY = "practice.sound.v1";
export const DEFAULT_SOUND: SoundSettings = { chime: true, haptic: false, volume: 5 };
export function readSound(): SoundSettings {
  const s = readLocal<Partial<SoundSettings>>(SOUND_KEY, {});
  return {
    chime: typeof s.chime === "boolean" ? s.chime : DEFAULT_SOUND.chime,
    haptic: typeof s.haptic === "boolean" ? s.haptic : DEFAULT_SOUND.haptic,
    volume: typeof s.volume === "number" ? Math.min(10, Math.max(0, Math.round(s.volume))) : DEFAULT_SOUND.volume,
  };
}
export const writeSound = (s: SoundSettings) => writeLocal(SOUND_KEY, s);

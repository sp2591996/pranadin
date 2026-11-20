/** Japa mala counter: pure logic. One mala is 108 beads. */
import type { JapaState } from "@/lib/types";
import { getStorage } from "@/lib/storage";
import { todayKey } from "@/features/shared/device";

export const BEADS_PER_MALA = 108;
/** Beads are counted in a whole number below this, so a stored value can never overflow the display. */
export const MAX_COUNT = 999_999_999;

export interface JapaView {
  /** Beads done in the current mala, 0 to 107. */
  beads: number;
  /** Whole malas finished. */
  malas: number;
  total: number;
}

export function view(count: number): JapaView {
  const c = sanitize(count);
  return { beads: c % BEADS_PER_MALA, malas: Math.floor(c / BEADS_PER_MALA), total: c };
}

export function sanitize(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) ? Math.min(MAX_COUNT, Math.max(0, Math.floor(n))) : 0;
}

/** One tap. `completed` is true when this bead finished a mala. */
export function tap(count: number): { count: number; completed: boolean } {
  const next = Math.min(MAX_COUNT, sanitize(count) + 1);
  return { count: next, completed: next % BEADS_PER_MALA === 0 };
}

const ID = "japa" as const;

export async function loadCount(): Promise<{ count: number; saved: boolean }> {
  try {
    const s = await getStorage();
    const rec = await s.japa.get(ID);
    return { count: sanitize(rec?.count), saved: s.backend !== "memory" };
  } catch {
    return { count: 0, saved: false };
  }
}

export async function saveCount(count: number): Promise<boolean> {
  try {
    const s = await getStorage();
    const rec: JapaState = { v: 1, id: ID, localDate: todayKey(), at: Date.now(), count: sanitize(count) };
    await s.japa.put(rec);
    return s.backend !== "memory";
  } catch {
    return false;
  }
}

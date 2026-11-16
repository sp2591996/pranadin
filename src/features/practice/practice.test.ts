import { describe, expect, it } from "vitest";
import type { PracticeLog } from "@/lib/types";
import { formatClock, isComplete, positionAt, roundsFor, SessionClock, sessionMs } from "./engine";
import { addDays } from "@/i18n/format";
import { computeProgress, computeStreak, isWpuWeek, mondayOf } from "./streak";

const sama = [
  { seconds: 4 }, // in
  { seconds: 4 }, // out
];
const deergha = [{ seconds: 4 }, { seconds: 6 }];

describe("breath engine", () => {
  it("picks whole rounds closest to the planned time", () => {
    expect(roundsFor(sama, 180)).toBe(23); // 180 / 8 = 22.5 → 23
    expect(roundsFor(deergha, 180)).toBe(18);
    expect(roundsFor(deergha, 1)).toBe(1);
    expect(sessionMs(deergha, 18)).toBe(180_000);
  });

  it("finds the phase at any elapsed time, with exact boundaries", () => {
    expect(positionAt(deergha, 18, 0)).toMatchObject({ round: 1, phaseIndex: 0, phaseSecondsLeft: 4, phaseStartMs: 0 });
    expect(positionAt(deergha, 18, 3_999)).toMatchObject({ phaseIndex: 0, phaseSecondsLeft: 1 });
    expect(positionAt(deergha, 18, 4_000)).toMatchObject({ phaseIndex: 1, phaseSecondsLeft: 6, phaseStartMs: 4_000 });
    expect(positionAt(deergha, 18, 10_000)).toMatchObject({ round: 2, phaseIndex: 0, phaseStartMs: 10_000 });
    expect(positionAt(deergha, 18, 179_999).done).toBe(false);
    expect(positionAt(deergha, 18, 180_000)).toMatchObject({ done: true, sessionRemainingMs: 0 });
  });

  it("does not drift: phase boundaries are exact after 3 minutes", () => {
    // 17 full rounds of 10 s: the 18th round starts at exactly 170 s.
    expect(positionAt(deergha, 18, 170_000)).toMatchObject({ round: 18, phaseIndex: 0, phaseElapsedMs: 0 });
  });

  it("counts completion at 80% of the plan", () => {
    expect(isComplete(144, 180)).toBe(true);
    expect(isComplete(143, 180)).toBe(false);
    expect(isComplete(10, 0)).toBe(false);
  });

  it("formats a countdown", () => {
    expect(formatClock(130_000)).toBe("2:10");
    expect(formatClock(59_001)).toBe("1:00");
    expect(formatClock(0)).toBe("0:00");
  });
});

describe("SessionClock", () => {
  it("measures elapsed time from timestamps, excluding pauses", () => {
    let t = 1000;
    const c = new SessionClock(() => t);
    c.start();
    t += 5_000;
    expect(c.elapsed()).toBe(5_000);
    c.pause();
    t += 60_000; // phone locked for a minute
    expect(c.elapsed()).toBe(5_000);
    c.resume();
    t += 2_500;
    expect(c.elapsed()).toBe(7_500);
  });

  it("can rewind to the start of the current phase on resume", () => {
    let t = 0;
    const c = new SessionClock(() => t);
    c.start();
    t = 6_500; // mid-way through the out-breath that began at 4 s
    c.pause();
    c.resume(positionAt(deergha, 18, c.elapsed()).phaseStartMs);
    expect(c.elapsed()).toBe(4_000);
    // never rewinds forward
    c.pause();
    c.resume(99_000);
    expect(c.elapsed()).toBe(4_000);
  });

  it("15-minute timer ends within 1 s of the wall clock (FR-5.5)", () => {
    let t = 0;
    const c = new SessionClock(() => t);
    c.start();
    // Simulate a jittery, throttled interval: ticks of 250–1,900 ms.
    let ticks = 0;
    while (c.elapsed() < 900_000) {
      t += 250 + ((ticks++ * 7919) % 1650);
    }
    expect(c.elapsed() - 900_000).toBeLessThan(1_900);
    expect(t).toBe(c.elapsed()); // elapsed equals wall time exactly
  });
});

let n = 0;
function log(localDate: string, opts: Partial<PracticeLog> = {}): PracticeLog {
  return {
    v: 1,
    id: `p${n++}`,
    at: 0,
    localDate,
    kind: "breath",
    refId: null,
    plannedSec: 180,
    actualSec: 180,
    completed: true,
    source: "free",
    ...opts,
  };
}
const days = (...d: string[]) => new Set(d);

// Week of Mon 16 Nov 2026.
const MON = "2026-11-16";
const TUE = "2026-11-17";
const WED = "2026-11-18";
const THU = "2026-11-19";
const FRI = "2026-11-20";
const SAT = "2026-11-21";
const SUN = "2026-11-22";

describe("streak (US-16)", () => {
  it("knows the week starts on Monday", () => {
    expect(mondayOf(TUE)).toBe(MON);
    expect(mondayOf(SUN)).toBe(MON);
    expect(mondayOf(MON)).toBe(MON);
  });

  it("is 0 with no practice and counts consecutive days", () => {
    expect(computeStreak(days(), TUE).streak).toBe(0);
    expect(computeStreak(days(MON, TUE), TUE).streak).toBe(2);
  });

  it("does not break before today ends", () => {
    expect(computeStreak(days(MON, TUE), WED).streak).toBe(2);
  });

  it("Mon practise, Tue skip, Wed practise = 3 (rest day used)", () => {
    const r = computeStreak(days(MON, WED), WED);
    expect(r.streak).toBe(3);
    expect(r.graceDays).toEqual([TUE]);
    expect(computeStreak(days(MON, WED), THU).streak).toBe(3);
  });

  it("then skipping Thu and Fri means a new streak by Sat, and week dots keep Mon and Wed", () => {
    expect(computeStreak(days(MON, WED), SAT).streak).toBe(0);
    const p = computeProgress([log(MON), log(WED)], SAT);
    expect(p.state).toBe("reset");
    expect(p.weekDots).toEqual([true, false, true, false, false, false, false]);
    expect(p.totalDays).toBe(2);
  });

  it("allows only one rest day per rolling 7 days", () => {
    // Mon, (Tue miss), Wed, (Thu miss), Fri: only the latest miss is bridged,
    // so the streak is Wed–Fri = 3, not Mon–Fri = 5.
    expect(computeStreak(days(MON, WED, FRI), FRI)).toEqual({ streak: 3, graceDays: [THU] });
    // Two misses 7 days apart are both bridged.
    const d = days("2026-11-02", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-12");
    expect(computeStreak(d, "2026-11-12").streak).toBe(11);
  });

  // The rule (kept from Dev-2, CoS 18 Nov): at most ONE rest day in any rolling
  // 7-day window. Rest days 7+ days apart are both bridged; 6 apart, only the later one.
  it("US-16 rule: one rest day per rolling 7 days, not per calendar week", () => {
    const run = (from: string, n: number, skip: number[]) => {
      const out: string[] = [];
      for (let i = 0; i < n; i++) if (!skip.includes(i)) out.push(addDays(from, i));
      return new Set(out);
    };
    const start = "2026-11-01"; // Sunday, so the window crosses a Mon week boundary
    // 15 days with rests on day 3 and day 10 (7 apart): unbroken, 15.
    expect(computeStreak(run(start, 15, [3, 10]), addDays(start, 14))).toEqual({
      streak: 15,
      graceDays: [addDays(start, 10), addDays(start, 3)],
    });
    // Rests on day 3 and day 9 (6 apart): the later one is bridged, so the streak restarts at day 4.
    expect(computeStreak(run(start, 15, [3, 9]), addDays(start, 14))).toEqual({ streak: 11, graceDays: [addDays(start, 9)] });
    // Rests on Sat 7 Nov and Mon 9 Nov fall in different calendar weeks but the same rolling window: still only one.
    expect(computeStreak(run(start, 12, [6, 8]), addDays(start, 11)).streak).toBe(5);
  });

  it("a pending rest day (yesterday missed) keeps the streak if no rest day was used this week", () => {
    expect(computeStreak(days(MON, TUE), THU).streak).toBe(3);
    expect(computeProgress([log(MON), log(TUE)], THU).state).toBe("grace");
  });

  it("only completed practices count, and totals are kept", () => {
    const p = computeProgress([log(MON, { actualSec: 600 }), log(TUE, { completed: false, actualSec: 30 })], TUE);
    expect(p.streak).toBe(1);
    expect(p.totalMinutes).toBe(10);
    expect(p.daysSinceLast).toBe(1);
  });

  it("one day never double-counts, even with several sessions", () => {
    const p = computeProgress([log(MON), log(MON), log(MON)], MON);
    expect(p.streak).toBe(1);
    expect(p.totalDays).toBe(1);
  });
});

describe("WPU (D-005)", () => {
  it("needs 3 sessions of 3+ min on 3 distinct days in the week", () => {
    expect(isWpuWeek([log(MON), log(WED), log(SUN)], MON)).toBe(true);
    expect(isWpuWeek([log(MON), log(MON), log(WED)], MON)).toBe(false);
    expect(isWpuWeek([log(MON), log(WED), log(FRI, { actualSec: 179 })], MON)).toBe(false);
    expect(isWpuWeek([log(MON), log(WED), log("2026-11-23")], MON)).toBe(false);
  });
});

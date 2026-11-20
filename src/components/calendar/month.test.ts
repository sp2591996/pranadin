import { describe, expect, it } from "vitest";
import { monthGrid, monthOf, shiftMonth } from "./month";

describe("calendar month grid", () => {
  it("starts on Monday and covers the whole month", () => {
    const w = monthGrid("2026-11"); // 1 Nov 2026 is a Sunday
    expect(w[0]![0]).toBe("2026-10-26");
    expect(w[0]![6]).toBe("2026-11-01");
    expect(w.at(-1)![0]).toBe("2026-11-30");
    expect(w).toHaveLength(6);
    expect(w.flat().filter((d) => monthOf(d) === "2026-11")).toHaveLength(30);
  });
  it("handles a month that ends on Sunday, and leap February", () => {
    expect(monthGrid("2027-02").flat().filter((d) => monthOf(d) === "2027-02")).toHaveLength(28);
    expect(monthGrid("2028-02").flat().filter((d) => monthOf(d) === "2028-02")).toHaveLength(29);
    expect(monthGrid("2027-02").at(-1)!.at(-1)).toBe("2027-02-28");
  });
  it("moves across year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
  });
});

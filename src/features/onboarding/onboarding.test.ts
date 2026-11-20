import { describe, expect, it } from "vitest";
import { stepFromHash } from "./Onboarding";

describe("onboarding deep links (US-03, QA-19)", () => {
  it("opens the asked step, but never past Welcome before 'I understand'", () => {
    expect(stepFromHash("", false)).toBe(0);
    expect(stepFromHash("#step-1", false)).toBe(1);
    expect(stepFromHash("#step-4", false)).toBe(1);
    expect(stepFromHash("#step-4", true)).toBe(4);
    expect(stepFromHash("#step-9", true)).toBe(0);
    expect(stepFromHash("#junk", true)).toBe(0);
  });
});

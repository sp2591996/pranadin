import { describe, expect, it } from "vitest";
import { formatMessage } from "./format-message";

describe("formatMessage (Content ICU subset)", () => {
  it("fills placeholders and keeps unknown ones visible", () => {
    expect(formatMessage("{time} left", { time: "2:10" })).toBe("2:10 left");
    expect(formatMessage("{missing} x")).toBe("{missing} x");
  });
  it("handles plurals with =0, one and other", () => {
    const t = "{count, plural, =0 {Start today} one {# day in a row} other {# days in a row}}";
    expect(formatMessage(t, { count: 0 })).toBe("Start today");
    expect(formatMessage(t, { count: 1 })).toBe("1 day in a row");
    expect(formatMessage(t, { count: 12 })).toBe("12 days in a row");
    expect(formatMessage(t, { count: 2 }, "mr")).toBe("2 days in a row");
  });
});
